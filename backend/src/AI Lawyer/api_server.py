"""
FastAPI microservice that exposes the RAG virtual-lawyer as HTTP endpoints
for a MERN (or any) backend to call.

Endpoints
---------
GET  /                          - browser landing (redirects to /docs)
GET  /health                     - liveness probe
POST /retrieve                   - retrieval only (no LLM), cheap & fast
POST /chat                       - retrieval + Gemini answer with citations

The service is stateless.  Multi-turn conversation is handled by the caller
(Express/MongoDB) passing a `history` array of prior turns.

Security
--------
A single pre-shared API key (`RAG_API_KEY` env var) is required in the
`X-API-Key` header of every request.  This is an **internal** service, never
expose it to the public internet directly - put your Express backend in
front of it.

Run
---
    set RAG_API_KEY=any-long-random-string
    # localhost only:
    py -m uvicorn api_server:app --host 127.0.0.1 --port 8000
    # LAN / MERN on another PC (e.g. POST http://192.168.1.50:8000/chat):
    py -m uvicorn api_server:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Literal

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

import rag_config as cfg
from rag_chatbot import VirtualLawyer, _make_llm as build_llm_backend  # noqa: PLC2701
from rag_retriever import PakLawsRetriever

log = logging.getLogger("rag.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


# ---------------------------------------------------------------------------
# App state - singletons initialised once at process start
# ---------------------------------------------------------------------------
class _State:
    retriever: PakLawsRetriever | None = None
    lawyer:    VirtualLawyer    | None = None


state = _State()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    log.info("warming up retriever and LLM ...")
    t0 = time.time()
    state.retriever = PakLawsRetriever()
    backend = build_llm_backend(
        cfg.LLM_BACKEND,
        cfg.LLM_MODEL,
        cfg.LLM_TEMPERATURE,
        gemini_fallback_model=cfg.LLM_MODEL_FALLBACK,
    )
    state.lawyer = VirtualLawyer(state.retriever, backend)
    log.info("warm-up complete in %.1fs  (backend=%s)",
             time.time() - t0, backend.__class__.__name__ if backend else "none")
    yield
    log.info("shutting down")


app = FastAPI(
    title="AI Lawyer RAG Service",
    version="1.0.0",
    description="Retrieval-augmented generation for Pakistani law. Internal use only.",
    lifespan=lifespan,
)

# CORS: browser calls from Vite/React dev servers need an allowed origin.
# `ERR_CONNECTION_TIMED_OUT` is NOT fixed by CORS — that means TCP never
# connected (firewall, wrong IP, or uvicorn bound only to 127.0.0.1).
# Set CORS_ORIGINS in .env as a comma-separated list; optional regex for LAN.
def _cors_settings() -> tuple[list[str], str | None]:
    default = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )
    raw = os.getenv("CORS_ORIGINS", default).strip()
    if raw == "*":
        return (["*"], None)
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    # LAN Vite (http://192.168.x.x:5173) without listing every PC:
    regex = os.getenv("CORS_ORIGIN_REGEX", r"^http://192\.168\.\d{1,3}\.\d{1,3}:\d+$")
    if os.getenv("CORS_DISABLE_LAN_REGEX", "").lower() in ("1", "true", "yes"):
        regex = None
    return (origins, regex)


_origins, _origin_regex = _cors_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Auth dependency - shared-secret API key
# ---------------------------------------------------------------------------
def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("RAG_API_KEY")
    if not expected:
        # fail closed - refuse to run without a configured key
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG_API_KEY is not configured on the server.",
        )
    if x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header.",
        )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class HistoryTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class RetrieveRequest(BaseModel):
    query: str = Field(min_length=3, max_length=2000)
    top_k: int = Field(default=cfg.TOP_K, ge=1, le=15)
    category: str | None = None


class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    top_k: int = Field(default=cfg.TOP_K, ge=1, le=15)
    category: str | None = Field(default=None,
        description="Optional filter, e.g. 'criminal', 'family', 'taxation'")
    history: list[HistoryTurn] = Field(default_factory=list, max_length=20)


class PassageOut(BaseModel):
    rank: int
    score: float | None = None
    act_title: str
    year: int | str | None = None
    section_ref: str | None = None
    category: str | None = None
    content: str


class RetrieveResponse(BaseModel):
    query: str
    count: int
    passages: list[PassageOut]


class ChatResponse(BaseModel):
    question: str
    answer: str
    citations: list[str]
    passages: list[PassageOut]
    used_llm: bool
    latency_ms: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _pack_passages(docs, scores: list[float] | None = None) -> list[PassageOut]:
    out: list[PassageOut] = []
    for i, d in enumerate(docs, 1):
        m = d.metadata
        out.append(PassageOut(
            rank=i,
            score=(scores[i - 1] if scores else None),
            act_title=m.get("act_title", "?"),
            year=m.get("year"),
            section_ref=m.get("section_ref"),
            category=m.get("category"),
            content=d.page_content,
        ))
    return out


def _merge_history_into_question(history: list[HistoryTurn], question: str) -> str:
    """Append the latest question to a compact transcript of prior turns so
    the retriever and LLM can resolve pronouns like 'what about the fine?'."""
    if not history:
        return question
    lines = [f"{t.role.upper()}: {t.content.strip()}" for t in history[-6:]]
    lines.append(f"USER: {question}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def root() -> RedirectResponse:
    """Opening http://127.0.0.1:8000/ in a browser lands here; API lives under /docs."""
    return RedirectResponse(url="/docs", status_code=307)


@app.get("/health")
def health() -> dict:
    """No auth. Used by Docker/k8s/Express uptime checks."""
    return {
        "status": "ok" if state.retriever is not None else "warming",
        "embedding_model": cfg.EMBEDDING_MODEL_NAME,
        "llm_backend": cfg.LLM_BACKEND,
        "llm_model": cfg.LLM_MODEL,
    }


@app.post("/retrieve", response_model=RetrieveResponse,
          dependencies=[Depends(require_api_key)])
def retrieve(req: RetrieveRequest) -> RetrieveResponse:
    assert state.retriever is not None
    flt = {"category": req.category} if req.category else None
    pairs = state.retriever.retrieve_with_scores(
        req.query, k=req.top_k, filter=flt,
    )
    docs   = [d for d, _ in pairs]
    scores = [float(s) for _, s in pairs]
    return RetrieveResponse(
        query=req.query,
        count=len(docs),
        passages=_pack_passages(docs, scores),
    )


@app.post("/chat", response_model=ChatResponse,
          dependencies=[Depends(require_api_key)])
def chat(req: ChatRequest) -> ChatResponse:
    assert state.lawyer is not None and state.retriever is not None
    t0 = time.time()
    retrieval_query = _merge_history_into_question(req.history, req.question)

    flt = {"category": req.category} if req.category else None
    docs = state.retriever.retrieve(retrieval_query, k=req.top_k, filter=flt)

    if state.lawyer.llm is None:
        # retrieval-only fallback if Gemini isn't configured
        answer = ("LLM is not configured on the server. Returning retrieved "
                  "passages only - please show them to the user as raw citations.")
        used_llm = False
    else:
        context = PakLawsRetriever.format_context(docs)
        # Weave prior turns into the user message so the LLM can resolve
        # follow-up questions like "what about the fine?".
        history_block = ""
        if req.history:
            turns = [f"{t.role.upper()}: {t.content.strip()}" for t in req.history[-6:]]
            history_block = "PRIOR CONVERSATION:\n" + "\n".join(turns) + "\n\n"
        user_message = f"{history_block}CURRENT QUESTION: {req.question}"
        prompt  = cfg.SYSTEM_PROMPT.format(context=context, question=user_message)
        answer  = state.lawyer.llm.generate(prompt).strip()
        used_llm = True

    return ChatResponse(
        question=req.question,
        answer=answer,
        citations=PakLawsRetriever.format_citations(docs),
        passages=_pack_passages(docs),
        used_llm=used_llm,
        latency_ms=int((time.time() - t0) * 1000),
    )
