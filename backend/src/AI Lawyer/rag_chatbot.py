"""
Interactive "Virtual Lawyer" chatbot.

Runs on top of the FAISS vector DB built by rag_ingest.py and answers
Pakistani-law questions with citations. The LLM backend is pluggable:

    auto     - try gemini -> openai -> ollama, first available wins
    openai   - needs  pip install langchain-openai   + env OPENAI_API_KEY
    gemini   - needs  pip install langchain-google-genai + env GOOGLE_API_KEY
    ollama   - needs  pip install langchain-ollama and a running `ollama serve`
    none     - retrieval-only demo (no LLM call, just shows top-k chunks)

Configure in rag_config.py or via env vars: LLM_BACKEND, LLM_MODEL,
LLM_MODEL_FALLBACK (Gemini only: retries on rate limit / 503 with fallback model).

Examples:
    py rag_chatbot.py                           # interactive REPL
    py rag_chatbot.py "punishment for theft under PPC"
    py rag_chatbot.py --no-llm "child marriage restraint act"
    set LLM_BACKEND=ollama && set LLM_MODEL=llama3.1 && py rag_chatbot.py
"""

from __future__ import annotations

import argparse
import os
import sys
import textwrap
from typing import Any, Protocol

# Load variables from a local .env file so GOOGLE_API_KEY / OPENAI_API_KEY etc.
# are available without exporting them by hand. Silently no-ops if missing.
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import rag_config as cfg
from rag_retriever import PakLawsRetriever


# -----------------------------------------------------------------------------
# Pluggable LLM backend
# -----------------------------------------------------------------------------

class _LLM(Protocol):
    def generate(self, prompt: str) -> str: ...


class _OpenAIBackend:
    def __init__(self, model: str | None = None, temperature: float = 0.1) -> None:
        from langchain_openai import ChatOpenAI           # type: ignore
        self.llm = ChatOpenAI(
            model=model or "gpt-4o-mini",
            temperature=temperature,
        )
    def generate(self, prompt: str) -> str:
        return self.llm.invoke(prompt).content  # type: ignore


def _gemini_retryable(exc: BaseException) -> bool:
    """True for rate limits, overload, timeouts — safe to try another Gemini model."""
    try:
        from google.api_core import exceptions as gexc  # type: ignore

        types: tuple[type[BaseException], ...] = (
            gexc.ResourceExhausted,
            gexc.ServiceUnavailable,
            gexc.DeadlineExceeded,
            gexc.InternalServerError,
        )
        if hasattr(gexc, "TooManyRequests"):
            types = types + (gexc.TooManyRequests,)
        if isinstance(exc, types):
            return True
    except Exception:
        pass
    name = type(exc).__name__.lower()
    if "timeout" in name:
        return True
    msg = str(exc).lower()
    needles = (
        "429",
        "503",
        "resource exhausted",
        "rate limit",
        "quota exceeded",
        "too many requests",
        "unavailable",
        "deadline exceeded",
        "timed out",
        "timeout",
    )
    return any(n in msg for n in needles)


class _GeminiBackend:
    def __init__(
        self,
        model: str | None = None,
        temperature: float = 0.1,
        fallback_model: str | None = None,
    ) -> None:
        from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore
        if not os.getenv("GOOGLE_API_KEY"):
            raise RuntimeError(
                "GOOGLE_API_KEY is not set. Get a free key at "
                "https://aistudio.google.com/app/apikey and either export it "
                "or drop it into a .env file next to this script."
            )
        primary_id = (model or "gemini-2.5-flash").strip()
        fb_raw = (fallback_model or "").strip()
        self._primary_id = primary_id
        self._fallback_id: str | None = None
        self._llm_primary = ChatGoogleGenerativeAI(
            model=primary_id,
            temperature=temperature,
        )
        self._llm_fallback: Any = None
        if fb_raw and fb_raw != primary_id:
            self._fallback_id = fb_raw
            self._llm_fallback = ChatGoogleGenerativeAI(
                model=fb_raw,
                temperature=temperature,
            )

    def generate(self, prompt: str) -> str:
        try:
            return self._llm_primary.invoke(prompt).content  # type: ignore
        except BaseException as exc:
            if self._llm_fallback is None or not _gemini_retryable(exc):
                raise
            print(
                f"[LLM] Gemini {self._primary_id!r} failed ({type(exc).__name__}); "
                f"retrying with {self._fallback_id!r}."
            )
            return self._llm_fallback.invoke(prompt).content  # type: ignore


class _OllamaBackend:
    def __init__(self, model: str | None = None, temperature: float = 0.1) -> None:
        from langchain_ollama import ChatOllama          # type: ignore
        self.llm = ChatOllama(
            model=model or "llama3.1",
            temperature=temperature,
        )
    def generate(self, prompt: str) -> str:
        return self.llm.invoke(prompt).content  # type: ignore


def _make_llm(
    backend: str,
    model: str,
    temperature: float,
    gemini_fallback_model: str | None = None,
):
    if backend == "openai":
        return _OpenAIBackend(model or None, temperature)
    if backend == "gemini":
        return _GeminiBackend(
            model or None,
            temperature,
            fallback_model=gemini_fallback_model,
        )
    if backend == "ollama":
        return _OllamaBackend(model or None, temperature)
    if backend == "none":
        return None

    # auto: try in this order, silently skip missing deps / creds.
    tried: list[str] = []
    for name, factory in [
        ("gemini", lambda: _GeminiBackend(
            model or None,
            temperature,
            fallback_model=gemini_fallback_model,
        ) if os.getenv("GOOGLE_API_KEY") else None),
        ("openai", lambda: _OpenAIBackend(model or None, temperature)
                    if os.getenv("OPENAI_API_KEY") else None),
        ("ollama", lambda: _OllamaBackend(model or None, temperature)),
    ]:
        try:
            llm = factory()
            if llm is not None:
                print(f"[LLM] using {name}")
                return llm
        except Exception as exc:                          # noqa: BLE001
            tried.append(f"{name}: {type(exc).__name__}")
    if tried:
        print(f"[LLM] no backend available ({'; '.join(tried)}) - "
              f"running in retrieval-only mode.")
    else:
        print("[LLM] no backend available - running in retrieval-only mode.")
    return None


# -----------------------------------------------------------------------------
# Orchestrator
# -----------------------------------------------------------------------------

class VirtualLawyer:
    def __init__(self, retriever: PakLawsRetriever, llm: Any | None) -> None:
        self.retriever = retriever
        self.llm = llm

    def answer(self, question: str, category: str | None = None) -> dict[str, Any]:
        flt = {"category": category} if category else None
        docs = self.retriever.retrieve(question, filter=flt)
        context = self.retriever.format_context(docs)
        citations = self.retriever.format_citations(docs)

        if self.llm is None:
            answer_text = (
                "[Retrieval-only mode - no LLM configured.]\n"
                "The most relevant statutory passages are shown above under "
                "CONTEXT.  To get a synthesised answer, configure an LLM "
                "backend (see rag_config.py / LLM_BACKEND env var)."
            )
        else:
            prompt = cfg.SYSTEM_PROMPT.format(context=context, question=question)
            answer_text = self.llm.generate(prompt).strip()

        return {
            "question":  question,
            "answer":    answer_text,
            "context":   context,
            "citations": citations,
            "documents": docs,
        }


# -----------------------------------------------------------------------------
# Pretty-printers
# -----------------------------------------------------------------------------

def _print_response(resp: dict[str, Any], show_context: bool) -> None:
    print("\n" + "=" * 78)
    print("ANSWER")
    print("-" * 78)
    print(textwrap.fill(resp["answer"], width=96,
                        replace_whitespace=False, drop_whitespace=False))
    print("\nSOURCES")
    print("-" * 78)
    for i, cite in enumerate(resp["citations"], 1):
        print(f"  [{i}] {cite}")
    if show_context:
        print("\nCONTEXT (passages sent to the LLM)")
        print("-" * 78)
        print(resp["context"])
    print("=" * 78 + "\n")


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="AI Lawyer - interactive chatbot")
    ap.add_argument("question", nargs="*",
                    help="One-shot question; omit for interactive REPL.")
    ap.add_argument("--category", default=None,
                    help="Filter retrieval by category "
                         "(criminal / family / taxation / ...).")
    ap.add_argument("--no-llm", action="store_true",
                    help="Force retrieval-only mode (no answer synthesis).")
    ap.add_argument("--show-context", action="store_true",
                    help="Also print the retrieved passages sent to the LLM.")
    ap.add_argument("-k", type=int, default=cfg.TOP_K,
                    help="Number of passages to retrieve.")
    args = ap.parse_args()

    print("Loading retriever ...")
    retriever = PakLawsRetriever(top_k=args.k)

    if args.no_llm:
        llm = None
    else:
        llm = _make_llm(
            cfg.LLM_BACKEND,
            cfg.LLM_MODEL,
            cfg.LLM_TEMPERATURE,
            gemini_fallback_model=cfg.LLM_MODEL_FALLBACK,
        )

    bot = VirtualLawyer(retriever, llm)

    # One-shot mode
    if args.question:
        q = " ".join(args.question)
        resp = bot.answer(q, category=args.category)
        _print_response(resp, show_context=args.show_context)
        return 0

    # REPL mode
    print("\nVirtual Lawyer (Pakistan).  Type your question, or:")
    print("  :category criminal     - filter by category")
    print("  :category              - clear the filter")
    print("  :context on|off        - show retrieved passages")
    print("  :k 8                   - change top-k")
    print("  :quit                  - exit\n")
    category = args.category
    show_ctx = args.show_context
    while True:
        try:
            q = input("you> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not q:
            continue
        if q.lower() in (":quit", ":exit", ":q"):
            break
        if q.startswith(":category"):
            parts = q.split(maxsplit=1)
            category = parts[1].strip() if len(parts) > 1 else None
            print(f"[filter] category = {category!r}")
            continue
        if q.startswith(":context"):
            show_ctx = q.split()[-1].lower() in ("on", "true", "yes", "1")
            print(f"[display] show_context = {show_ctx}")
            continue
        if q.startswith(":k"):
            try:
                retriever.top_k = int(q.split()[-1])
                print(f"[retriever] top_k = {retriever.top_k}")
            except ValueError:
                print("usage: :k 8")
            continue
        resp = bot.answer(q, category=category)
        _print_response(resp, show_context=show_ctx)
    return 0


if __name__ == "__main__":
    sys.exit(main())
