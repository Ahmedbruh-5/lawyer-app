"""
Merge the main RAG JSONL with optional supplemental corpora (same schema as
``pak_laws_rag.jsonl``) into ``pak_laws_rag_merged.jsonl``.

Default inputs (in order):
  1. pak_laws_rag.jsonl
  2. ad_law_files/ad_laws_rag.jsonl   (skipped if missing)

Then point ``rag_config.CORPUS_JSONL`` at the merged file and run::

    py rag_ingest.py --force

Streaming merge — does not load either file fully into RAM.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_SOURCES = [
    ROOT / "pak_laws_rag.jsonl",
    ROOT / "ad_law_files" / "ad_laws_rag.jsonl",
]
OUTPUT = ROOT / "pak_laws_rag_merged.jsonl"


def _validate_line(obj: dict, path: Path, line_no: int) -> bool:
    for k in ("chunk_id", "doc_id", "text"):
        if k not in obj:
            print(f"  WARN {path.name}:{line_no} missing {k!r} — skipped", file=sys.stderr)
            return False
    return True


def merge_sources(sources: list[Path], out: Path) -> tuple[int, int]:
    total_written = 0
    total_skipped = 0
    with out.open("w", encoding="utf-8") as fout:
        for src in sources:
            if not src.is_file():
                print(f"  skip (not found): {src}")
                continue
            n_file = 0
            with src.open(encoding="utf-8") as fin:
                for line_no, line in enumerate(fin, 1):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                    except json.JSONDecodeError as e:
                        print(f"  WARN {src.name}:{line_no} JSON: {e}", file=sys.stderr)
                        total_skipped += 1
                        continue
                    if not _validate_line(obj, src, line_no):
                        total_skipped += 1
                        continue
                    fout.write(json.dumps(obj, ensure_ascii=False) + "\n")
                    n_file += 1
                    total_written += 1
            print(f"  + {src.name}: {n_file:,} chunks")
    return total_written, total_skipped


def main() -> int:
    print("Merging RAG corpora ->", OUTPUT.name)
    n_out, n_skip = merge_sources(DEFAULT_SOURCES, OUTPUT)
    mb = OUTPUT.stat().st_size / 1024 / 1024
    print(f"\nWrote {n_out:,} lines ({mb:.2f} MB) -> {OUTPUT}")
    if n_skip:
        print(f"Skipped {n_skip} bad lines (see warnings above).", file=sys.stderr)
    print("\nNext:  py rag_ingest.py --force")
    return 0


if __name__ == "__main__":
    sys.exit(main())
