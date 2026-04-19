"""
Reusable retriever for the AI Lawyer vector DB.

Load the FAISS index built by rag_ingest.py and query it from anywhere:

    from rag_retriever import PakLawsRetriever
    r = PakLawsRetriever()
    hits = r.retrieve("What is the punishment for murder in Pakistan?")
    for h in hits:
        print(h.metadata["act_title"], h.metadata["section_ref"])
        print(h.page_content[:500])

The class exposes:
  .retrieve(query, k=..., filter=...)      -> list[Document]
  .retrieve_with_scores(query, k=...)      -> list[(Document, score)]
  .format_context(docs)                    -> str (prompt-ready)
  .as_langchain_retriever()                -> LangChain BaseRetriever

`filter` is a dict matching chunk metadata, e.g.
    r.retrieve("dowry",            filter={"category": "family"})
    r.retrieve("death penalty",    filter={"category": "criminal"})
    r.retrieve("income tax rate",  filter={"category": "taxation"})
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

import rag_config as cfg


class PakLawsRetriever:
    """Thin wrapper around LangChain's FAISS retriever with BGE query prefix."""

    def __init__(
        self,
        index_dir: str | Path = cfg.INDEX_DIR,
        embedding_model: str = cfg.EMBEDDING_MODEL_NAME,
        device: str = cfg.DEVICE,
        top_k: int = cfg.TOP_K,
        fetch_k: int = cfg.FETCH_K,
        use_mmr: bool = cfg.USE_MMR,
        mmr_lambda: float = cfg.MMR_LAMBDA,
    ) -> None:
        self.index_dir = Path(index_dir)
        if not self.index_dir.exists():
            raise FileNotFoundError(
                f"FAISS index not found at {self.index_dir}. "
                "Run `py rag_ingest.py` first."
            )

        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            model_kwargs={"device": device},
            encode_kwargs={"normalize_embeddings": True},
        )

        # allow_dangerous_deserialization: we trust our own pickle.
        self.store: FAISS = FAISS.load_local(
            str(self.index_dir),
            self.embeddings,
            allow_dangerous_deserialization=True,
        )

        self.top_k      = top_k
        self.fetch_k    = fetch_k
        self.use_mmr    = use_mmr
        self.mmr_lambda = mmr_lambda

    # ------------------------------------------------------------------ core

    def _prep_query(self, query: str) -> str:
        """Prepend BGE query instruction when using a BGE model."""
        if cfg.BGE_QUERY_INSTRUCTION:
            return cfg.BGE_QUERY_INSTRUCTION + query
        return query

    def retrieve(
        self,
        query: str,
        k: int | None = None,
        filter: dict[str, Any] | None = None,
    ) -> list[Document]:
        q = self._prep_query(query)
        k = k or self.top_k
        if self.use_mmr:
            return self.store.max_marginal_relevance_search(
                q, k=k, fetch_k=self.fetch_k,
                lambda_mult=self.mmr_lambda, filter=filter,
            )
        return self.store.similarity_search(q, k=k, filter=filter)

    def retrieve_with_scores(
        self,
        query: str,
        k: int | None = None,
        filter: dict[str, Any] | None = None,
    ) -> list[tuple[Document, float]]:
        """Return (Document, similarity_score) pairs.  Higher = more similar
        because we used normalised embeddings with an inner-product index."""
        q = self._prep_query(query)
        return self.store.similarity_search_with_relevance_scores(
            q, k=k or self.top_k, filter=filter,
        )

    # ------------------------------------------------------------- utilities

    def as_langchain_retriever(self, **kw: Any):
        """Drop-in LangChain retriever for chains and agents."""
        search_type = "mmr" if self.use_mmr else "similarity"
        search_kwargs = {
            "k": kw.pop("k", self.top_k),
            **({"fetch_k": self.fetch_k, "lambda_mult": self.mmr_lambda}
               if self.use_mmr else {}),
            **kw,
        }
        # Wrap retrieval so the BGE prefix is applied automatically.
        base = self.store.as_retriever(
            search_type=search_type, search_kwargs=search_kwargs
        )
        if not cfg.BGE_QUERY_INSTRUCTION:
            return base
        return _BGEPrefixRetriever(base=base, prefix=cfg.BGE_QUERY_INSTRUCTION)

    @staticmethod
    def format_context(docs: list[Document], max_chars: int = 6000) -> str:
        """Format retrieved chunks into a single prompt-ready block with
        explicit citations.  Truncates to stay under `max_chars`."""
        parts: list[str] = []
        running = 0
        if not docs:
            return (
                "(No passages were retrieved from the indexed law database "
                "for this query.)"
            )
        for i, d in enumerate(docs, 1):
            meta = d.metadata
            year = meta.get("year")
            year_str = f" ({year})" if year else ""
            section  = meta.get("section_ref", "?")
            title    = meta.get("act_title", "?")
            header = f"[{i}] {title}{year_str}  -  {section}"
            body = d.page_content.strip()
            block = f"{header}\n{body}\n"
            if running + len(block) > max_chars:
                break
            parts.append(block)
        return "\n".join(parts)

    @staticmethod
    def format_citations(docs: list[Document]) -> list[str]:
        """Short citation strings, one per retrieved chunk."""
        out = []
        for d in docs:
            m = d.metadata
            year = f", {m['year']}" if m.get("year") else ""
            sec  = f", {m['section_ref']}" if m.get("section_ref") else ""
            out.append(f"{m.get('act_title','?')}{year}{sec}")
        return out


# -----------------------------------------------------------------------------
# Internal: LangChain retriever that prepends BGE instruction
# -----------------------------------------------------------------------------

from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from pydantic import Field


class _BGEPrefixRetriever(BaseRetriever):
    """Wraps another retriever and prepends the BGE query instruction."""

    base:   BaseRetriever = Field(...)
    prefix: str           = Field(...)

    def _get_relevant_documents(  # noqa: D401
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> list[Document]:
        return self.base.invoke(self.prefix + query)


# -----------------------------------------------------------------------------
# CLI smoke-test
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse, textwrap

    ap = argparse.ArgumentParser(
        description="Quick retrieval smoke-test against the FAISS index."
    )
    ap.add_argument("query", nargs="+", help="Natural-language legal question.")
    ap.add_argument("-k", type=int, default=5)
    ap.add_argument("--category", default=None,
                    help="Filter by category, e.g. criminal / family / taxation.")
    args = ap.parse_args()

    q = " ".join(args.query)
    r = PakLawsRetriever()
    flt = {"category": args.category} if args.category else None
    hits = r.retrieve_with_scores(q, k=args.k, filter=flt)

    print(f"\nQuery: {q}\n" + "-" * 72)
    for i, (doc, score) in enumerate(hits, 1):
        m = doc.metadata
        print(f"\n[{i}] score={score:.3f}  "
              f"{m.get('act_title','?')} ({m.get('year','?')})  "
              f"- {m.get('section_ref','?')}")
        print(textwrap.fill(doc.page_content[:400], width=90, subsequent_indent="    "))
