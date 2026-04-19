"""
Turn ``*.cleaned.json`` documents under ``ad_law_files/`` into RAG JSONL using the
same chunking rules and per-line schema as ``pak_laws_rag.jsonl``.

Each output line is one JSON object with keys:
    chunk_id, doc_id, act_title, year, category, status, updated_till,
    source_file, section_ref, chunk_index, char_count, token_est, text, total_chunks

By default ``doc_id`` is prefixed with ``adl-`` so chunk_ids do not collide with the
main ``pak_laws_rag.jsonl`` (same acts often share the same slug).

Usage
-----
    py build_ad_law_rag_jsonl.py
    py build_ad_law_rag_jsonl.py --output ad_law_files/ad_laws_rag.jsonl
    py build_ad_law_rag_jsonl.py --no-doc-id-prefix   # only if you will NOT merge with pak_laws_rag
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from typing import Any

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
AD_DIR = os.path.join(WORKSPACE, "ad_law_files")

# The four laws you asked for (same chunking pipeline as pak_laws_rag.jsonl).
DEFAULT_INPUTS = [
    "Code-of-Civil-Procedure-1908.cleaned.json",
    "Code-of-Criminal-Procedure-1898.cleaned.json",
    "qanun-e-shahadat-order-1984-doc-pdf.cleaned.json",
    "The Punjab Criminal Prosecution Service Inspectorate Act, 2018.cleaned.json",
]

from build_rag_corpus import chunk_document  # noqa: E402


def _load_doc(path: str) -> dict[str, Any] | None:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        print(f"  skip (not a single object): {path}", file=sys.stderr)
        return None
    if data.get("extraction_error"):
        print(f"  skip (extraction_error): {os.path.basename(path)}", file=sys.stderr)
        return None
    text = (data.get("text") or "").strip()
    if not text:
        print(f"  skip (empty text): {os.path.basename(path)}", file=sys.stderr)
        return None
    required = ("doc_id", "act_title", "source_file", "category", "status")
    for k in required:
        if k not in data:
            print(f"  skip (missing {k}): {path}", file=sys.stderr)
            return None
    return data


def _emit_chunks(
    docs: list[dict[str, Any]],
    doc_id_prefix: str,
) -> list[dict[str, Any]]:
    chunks_all: list[dict[str, Any]] = []
    for d in docs:
        d = dict(d)  # shallow copy
        orig_id = d["doc_id"]
        d["doc_id"] = f"{doc_id_prefix}{orig_id}" if doc_id_prefix else orig_id

        pieces = chunk_document(d["text"], d)
        for idx, ch in enumerate(pieces):
            body = ch["text"]
            chunk_id = f"{d['doc_id']}::chunk-{idx:04d}"
            chunks_all.append({
                "chunk_id":      chunk_id,
                "doc_id":        d["doc_id"],
                "act_title":     d["act_title"],
                "year":          d.get("year"),
                "category":      d["category"],
                "status":        d["status"],
                "updated_till":  d.get("updated_till"),
                "source_file":   d["source_file"],
                "section_ref":   ch["section_ref"],
                "chunk_index":   idx,
                "char_count":    len(body),
                "token_est":     max(1, len(body) // 4),
                "text":          body,
            })

    per_doc = Counter(c["doc_id"] for c in chunks_all)
    for c in chunks_all:
        c["total_chunks"] = per_doc[c["doc_id"]]
    return chunks_all


def main() -> int:
    ap = argparse.ArgumentParser(description="Build ad_law RAG JSONL (pak_laws_rag schema).")
    ap.add_argument(
        "--inputs",
        nargs="*",
        default=None,
        help="Basenames under ad_law_files/ (default: the four CPC/CrPC/Shahadat/Punjab Act files)",
    )
    ap.add_argument(
        "--output",
        default=os.path.join(AD_DIR, "ad_laws_rag.jsonl"),
        help="Output JSONL path",
    )
    ap.add_argument(
        "--no-doc-id-prefix",
        action="store_true",
        help="Do not prefix doc_id (chunk_ids may collide with pak_laws_rag if merged)",
    )
    args = ap.parse_args()

    names = args.inputs if args.inputs else DEFAULT_INPUTS
    doc_id_prefix = "" if args.no_doc_id_prefix else "adl-"

    docs: list[dict[str, Any]] = []
    for name in names:
        path = os.path.join(AD_DIR, name)
        if not os.path.isfile(path):
            print(f"  missing file: {path}", file=sys.stderr)
            continue
        rec = _load_doc(path)
        if rec:
            docs.append(rec)
            print(f"  loaded: {name}")

    if not docs:
        print("No documents to chunk.", file=sys.stderr)
        return 1

    chunks = _emit_chunks(docs, doc_id_prefix)
    out_path = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")

    print(f"\nWrote {len(chunks):,} lines -> {out_path}")
    by_doc: Counter[str] = Counter(c["doc_id"] for c in chunks)
    for doc_id, n in sorted(by_doc.items()):
        print(f"    {doc_id}: {n} chunks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
