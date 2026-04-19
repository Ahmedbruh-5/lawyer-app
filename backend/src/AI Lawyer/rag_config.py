"""
Central configuration for the AI Lawyer RAG pipeline.

Every other rag_* module reads its settings from here, so tuning the
retriever, changing the embedding model, or pointing at a different
corpus is a one-file edit.
"""

from __future__ import annotations

import os
from pathlib import Path

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------

ROOT_DIR       = Path(__file__).resolve().parent
# Merged corpus = main pakistanlaws.gov.pk export + supplemental ``ad_laws_rag.jsonl``.
# Build with:  py merge_rag_corpora.py
# Override:    set RAG_CORPUS_JSONL=pak_laws_rag.jsonl
_corpus_name = os.getenv("RAG_CORPUS_JSONL", "pak_laws_rag_merged.jsonl")
CORPUS_JSONL   = ROOT_DIR / _corpus_name if not Path(_corpus_name).is_absolute() else Path(_corpus_name)
INDEX_DIR      = ROOT_DIR / "faiss_index"               # output (vector DB)
# FAISS.save_local writes these two files inside INDEX_DIR:
#     index.faiss     - the raw FAISS index
#     index.pkl       - the LangChain docstore & id map


# -----------------------------------------------------------------------------
# Embedding model (HuggingFace)
# -----------------------------------------------------------------------------
# Recommended models (pick ONE; the default is best speed / quality tradeoff
# for CPU ingestion of ~23 K legal chunks):
#
#   BAAI/bge-small-en-v1.5   - 384 dim, 33 M params   <- DEFAULT (fast on CPU)
#   BAAI/bge-base-en-v1.5    - 768 dim, 110 M params  (higher quality)
#   BAAI/bge-large-en-v1.5   - 1024 dim, 335 M params (best quality, slow on CPU)
#   BAAI/bge-m3              - 1024 dim, multilingual (use if you need Urdu)
#   intfloat/e5-base-v2      - 768 dim, strong alt.
#
# BGE models require an explicit query instruction for asymmetric retrieval;
# we apply it in rag_retriever.py when embedding user queries.

EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL",
    "BAAI/bge-small-en-v1.5",
)

# Query-time instruction recommended by the BGE authors. Leave empty for
# non-BGE models.
BGE_QUERY_INSTRUCTION = (
    "Represent this sentence for searching relevant passages: "
    if "bge" in EMBEDDING_MODEL_NAME.lower()
    else ""
)

# Device: auto-detect CUDA, fall back to CPU.
def _auto_device() -> str:
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass
    return "cpu"

DEVICE = os.getenv("EMBEDDING_DEVICE", _auto_device())

# Batch size used by sentence-transformers at embedding time.
# 32 is safe for CPU; bump to 128+ on a GPU.
EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))


# -----------------------------------------------------------------------------
# Retrieval defaults
# -----------------------------------------------------------------------------

TOP_K          = int(os.getenv("TOP_K",          "5"))   # docs returned to LLM
FETCH_K        = int(os.getenv("FETCH_K",        "20"))  # candidates before MMR
MMR_LAMBDA     = float(os.getenv("MMR_LAMBDA",   "0.5")) # 0=diverse, 1=similar
USE_MMR        = os.getenv("USE_MMR", "true").lower() == "true"


# -----------------------------------------------------------------------------
# Chatbot (generation) defaults - only used if an LLM backend is configured
# -----------------------------------------------------------------------------

# Default: Google Gemini (free tier on AI Studio).
# Available free-tier models (April 2026):
#   gemini-2.5-flash-lite   - 15 RPM, 1000 RPD  <- typical fallback after quota hits
#   gemini-2.5-flash        - 10 RPM,  ~500 RPD (better quality)
#   gemini-2.5-pro          -  5 RPM,   100 RPD (best quality, low quota)
# Override via env:  set LLM_BACKEND=gemini  set LLM_MODEL=gemini-2.5-flash
# LLM_MODEL_FALLBACK is used only when LLM_BACKEND=gemini (or auto picks Gemini).
# Set LLM_MODEL_FALLBACK= to empty string to disable fallback.
LLM_BACKEND    = os.getenv("LLM_BACKEND", "gemini")       # gemini | openai | ollama | none | auto
LLM_MODEL      = os.getenv("LLM_MODEL",   "gemini-2.5-flash")
_LLM_FB_RAW    = os.getenv("LLM_MODEL_FALLBACK", "gemini-2.5-flash-lite")
LLM_MODEL_FALLBACK = _LLM_FB_RAW.strip() or None
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.1"))


# -----------------------------------------------------------------------------
# System prompt for the virtual lawyer assistant
# -----------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are "Virtual Lawyer", an AI legal assistant specialised in the laws of \
the Islamic Republic of Pakistan. You answer questions from members of the \
public about statutes, punishments, rights and procedures.

RULES OF ENGAGEMENT
1. When the CONTEXT passages below clearly and materially answer the question, \
base your answer on them. Always cite each passage you rely on using this \
format: (Act Title, YYYY, Section N). When the user asks about penalties, quote \
terms of imprisonment, fines, or other punishments exactly as they appear in \
those passages.

2. When CONTEXT is empty, only tangentially related, or does not cover the \
question, do **not** reply with a refusal or a bare statement that the answer \
is "not in the provided context". Instead, give a helpful response using your \
general knowledge about law and practice as it may apply in Pakistan. Start \
that portion with a short bold label **in the same language as your answer** \
(e.g. English: **General guidance (not sourced from the indexed statutes \
above)**; Roman Urdu: e.g. **Aam mashwara (neeche diye gaye indexed statutes \
se nahi hai)**). In that mode: do not invent verbatim statutory \
text, exact section numbers, or precise fines that are not in CONTEXT—explain \
at a suitable level of generality, note uncertainty where it exists, and tell \
the user to verify against current official sources (e.g. Pakistan Laws / \
gazettes) and a qualified advocate.

3. You may combine (1) and (2): briefly use any relevant CONTEXT, then add \
labelled general guidance for parts the index does not cover.

4. **Language — mirror the user.** Detect the QUESTION (and any prior-turn \
text in it): if it is in **standard English**, write the **entire** answer in \
clear English. If it is in **Roman Urdu** (Urdu in Latin script, e.g. kya, \
kaise, hai, nahi, mulzim, saza, case), write the **entire** answer in Roman \
Urdu in a natural matching tone (formal/informal like the user). If the user \
mixes both, follow the **dominant** language. Act titles or quotes taken from \
CONTEXT may stay as written; your explanation, headings, labels, and disclaimer \
must follow this language rule.

5. Keep the answer concise, in plain language without heavy legalese, and \
structured with short paragraphs or bullets.

6. End with a one-line disclaimer **in the same language as the answer**. \
English example: "This is legal information, not legal advice—please consult a \
qualified advocate before acting on it." Roman Urdu example: "Yeh sirf legal \
maloomat hai, lawyer ki salah nahi—koi qadam uthane se pehle kisi advocate se \
mashwara karein."

7. If the question is clearly outside Pakistani law (e.g. US criminal law), \
decline briefly **in the user's language** and suggest consulting the relevant \
jurisdiction's sources.

CONTEXT
{context}

QUESTION
{question}

ANSWER:"""


# -----------------------------------------------------------------------------
# Convenience
# -----------------------------------------------------------------------------

def describe() -> str:
    return (
        f"corpus        : {CORPUS_JSONL}\n"
        f"index dir     : {INDEX_DIR}\n"
        f"embedding     : {EMBEDDING_MODEL_NAME}\n"
        f"device        : {DEVICE}\n"
        f"batch size    : {EMBEDDING_BATCH_SIZE}\n"
        f"top_k         : {TOP_K}  (fetch_k={FETCH_K}, mmr={USE_MMR})\n"
        f"llm backend   : {LLM_BACKEND}\n"
        f"llm model     : {LLM_MODEL}"
        + (f"  (fallback: {LLM_MODEL_FALLBACK})" if LLM_MODEL_FALLBACK else "")
        + "\n"
    )
