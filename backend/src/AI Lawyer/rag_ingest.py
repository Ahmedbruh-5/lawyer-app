"""
Ingest pak_laws_rag.jsonl into a FAISS vector store using a HuggingFace
embedding model.

Pipeline:
    1. Stream the JSONL and build a list of LangChain Documents, preserving
       all the chunk metadata (doc_id, act_title, year, category, status,
       section_ref, etc.) emitted by build_rag_corpus.py.
    2. Instantiate the configured HuggingFace embedding model
       (default: BAAI/bge-small-en-v1.5).
    3. Embed every chunk in batches and store the result in a FAISS index.
    4. Save the index + docstore to ./faiss_index/  (two files:
       index.faiss, index.pkl).  These two files ARE your vector DB.

Usage:
    py rag_ingest.py                # build with defaults
    py rag_ingest.py --force        # rebuild even if an index already exists
    py rag_ingest.py --limit 500    # quick sanity run on first 500 chunks
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from pathlib import Path
from typing import Iterator

from tqdm import tqdm

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

import rag_config as cfg


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def _iter_jsonl(path: Path) -> Iterator[dict]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def load_documents(path: Path, limit: int | None = None) -> list[Document]:
    """Stream the JSONL corpus into a list of LangChain Documents."""
    docs: list[Document] = []
    for i, rec in enumerate(_iter_jsonl(path)):
        if limit is not None and i >= limit:
            break
        text = rec.get("text", "") or ""
        # Copy metadata without mutating the parsed dict (safer if records are cached).
        meta = {k: v for k, v in rec.items() if k != "text"}
        docs.append(Document(page_content=text, metadata=meta))
    return docs


def build_embeddings() -> HuggingFaceEmbeddings:
    """Create the HuggingFace embeddings wrapper.

    We normalise embeddings because BGE / E5 retrieval is designed for
    cosine-similarity scoring; FAISS can then use a flat inner-product
    index and get cosine-like behaviour for free.
    """
    model_kwargs = {"device": cfg.DEVICE}
    # Note: `show_progress_bar` is controlled by the `show_progress` flag on
    # the class itself in langchain-huggingface >= 1.2; don't duplicate it
    # inside encode_kwargs or sentence-transformers raises TypeError.
    encode_kwargs = {
        "normalize_embeddings": True,
        "batch_size": cfg.EMBEDDING_BATCH_SIZE,
    }
    return HuggingFaceEmbeddings(
        model_name=cfg.EMBEDDING_MODEL_NAME,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs,
        show_progress=True,
    )


def _human(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    return f"{h:d}h{m:02d}m{s:02d}s" if h else f"{m:d}m{s:02d}s"


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Build FAISS index from pak_laws_rag.jsonl")
    parser.add_argument("--force", action="store_true",
                        help="Delete any existing index dir and rebuild.")
    parser.add_argument("--limit", type=int, default=None,
                        help="Only ingest the first N chunks (for smoke tests).")
    parser.add_argument("--corpus", type=Path, default=cfg.CORPUS_JSONL,
                        help="Path to the JSONL corpus.")
    parser.add_argument("--out", type=Path, default=cfg.INDEX_DIR,
                        help="Output directory for the FAISS index.")
    args = parser.parse_args()

    print("AI Lawyer - FAISS ingestion")
    print("-" * 60)
    print(cfg.describe())
    print(f"corpus file   : {args.corpus}")
    print(f"output dir    : {args.out}")
    print("-" * 60)

    if not args.corpus.exists():
        print(f"ERROR: corpus file not found: {args.corpus}", file=sys.stderr)
        print("       run build_rag_corpus.py (main) and/or py merge_rag_corpora.py", file=sys.stderr)
        return 2

    if args.out.exists() and any(args.out.iterdir()):
        if args.force:
            print(f"Removing existing index at {args.out} ...")
            shutil.rmtree(args.out)
        else:
            print(f"Index already exists at {args.out}. "
                  "Pass --force to rebuild.", file=sys.stderr)
            return 1
    args.out.mkdir(parents=True, exist_ok=True)

    # ---- 1. Load documents -------------------------------------------------
    t0 = time.time()
    print("[1/3] Loading chunks ...")
    docs = load_documents(args.corpus, limit=args.limit)
    print(f"       loaded {len(docs):,} chunks "
          f"({sum(len(d.page_content) for d in docs):,} chars)")

    # ---- 2. Build embeddings ----------------------------------------------
    print(f"[2/3] Loading embedding model '{cfg.EMBEDDING_MODEL_NAME}' on {cfg.DEVICE} ...")
    embeddings = build_embeddings()

    # Warm-up + show vector dim so the user can sanity-check.
    probe = embeddings.embed_query("test")
    print(f"       embedding dim = {len(probe)}")

    # ---- 3. Embed + index -------------------------------------------------
    print(f"[3/3] Embedding {len(docs):,} chunks and building FAISS index "
          f"(this is the long step - go grab coffee) ...")
    t_embed = time.time()
    vs = FAISS.from_documents(documents=docs, embedding=embeddings)
    print(f"       embedded in {_human(time.time() - t_embed)}")

    print(f"Saving FAISS index to {args.out} ...")
    vs.save_local(str(args.out))

    # ---- Report -----------------------------------------------------------
    index_size = sum(p.stat().st_size for p in args.out.glob("*")) / 1024 / 1024
    print("-" * 60)
    print(f"DONE in {_human(time.time() - t0)}")
    print(f"  chunks indexed : {len(docs):,}")
    print(f"  index files    : {', '.join(p.name for p in args.out.iterdir())}")
    print(f"  on-disk size   : {index_size:.2f} MB")
    print(f"\nYour vector DB is at:  {args.out}")
    print("Next step:  py rag_chatbot.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
