"""
Extract text from every PDF in ``ad_law_files/``, clean and enrich metadata using
the same pipeline as ``pak_laws_cleaned.json``, and write **one JSON file per PDF**
into the same folder.

Each output file is a single JSON **object** with the same keys as one element of
``pak_laws_cleaned.json``:
    source_file, act_title, year, updated_till, status, category,
    char_count, token_est, doc_id, text

Usage
-----
    cd "d:\\AI Lawyer"
    py -m pip install pypdf
    py extract_ad_law_pdfs.py

Optional:
    py extract_ad_law_pdfs.py --dir "d:\\AI Lawyer\\ad_law_files"
    py extract_ad_law_pdfs.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Any

# Same directory as this script = workspace root for default paths.
WORKSPACE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT_DIR = os.path.join(WORKSPACE, "ad_law_files")

# Reuse cleaning + metadata from the main corpus builder.
from build_rag_corpus import clean_text, extract_metadata  # noqa: E402


def _pdf_paths(directory: str) -> list[str]:
    out: list[str] = []
    if not os.path.isdir(directory):
        return out
    for name in os.listdir(directory):
        if name.lower().endswith(".pdf"):
            out.append(os.path.join(directory, name))
    return sorted(out)


def _safe_json_stem(pdf_name: str) -> str:
    """Base name for the output .json file (no extension)."""
    stem = os.path.splitext(pdf_name)[0]
    # Windows-forbidden in filenames (we only change pathological stems)
    stem = re.sub(r'[<>:"/\\\\|?*]', "_", stem).strip() or "document"
    return stem


def extract_pdf_text(path: str) -> tuple[str, str | None]:
    """
    Return (raw_text, error_message).
    error_message is set when the file is unreadable or has no extractable text.
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        return "", "pypdf is not installed. Run: py -m pip install pypdf"

    try:
        reader = PdfReader(path)
    except Exception as exc:  # noqa: BLE001
        return "", f"cannot open PDF: {exc}"

    if getattr(reader, "is_encrypted", False):
        try:
            if not reader.decrypt(""):  # empty password
                return "", "PDF is password-protected; decrypt before extraction."
        except Exception as exc:  # noqa: BLE001
            return "", f"encrypted PDF: {exc}"

    parts: list[str] = []
    for page in reader.pages:
        try:
            t = page.extract_text()
        except Exception:  # noqa: BLE001
            t = ""
        if t and t.strip():
            parts.append(t.strip())

    raw = "\n\n".join(parts)
    if raw.strip():
        return raw, None

    # Some PDFs expose text to PyMuPDF but not pypdf (rare); try before giving up.
    try:
        import fitz  # PyMuPDF, optional dependency
    except ImportError:
        return "", "no text extracted (scanned image PDF or empty pages)."

    try:
        doc = fitz.open(path)
        fitz_parts: list[str] = []
        for i in range(len(doc)):
            t = doc[i].get_text()
            if t and t.strip():
                fitz_parts.append(t.strip())
        raw2 = "\n\n".join(fitz_parts)
    except Exception as exc:  # noqa: BLE001
        return "", f"no text from pypdf; PyMuPDF failed: {exc}"

    if not raw2.strip():
        return "", "no text extracted (likely scanned images — OCR or re-export as text PDF required)."
    return raw2, None


def build_record(pdf_path: str, file_name: str) -> dict[str, Any]:
    raw, err = extract_pdf_text(pdf_path)
    if err:
        # Still emit a structured stub so the folder lists failed imports clearly.
        meta = extract_metadata(file_name, "")
        if not meta.get("act_title") or meta["act_title"] == "Untitled":
            meta["act_title"] = _title_from_filename(file_name)
        meta["extraction_error"] = err
        meta["char_count"] = 0
        meta["token_est"] = 0
        meta["text"] = ""
        return meta

    cleaned = clean_text(raw)
    meta = extract_metadata(file_name, cleaned)
    meta["text"] = cleaned
    return meta


def _title_from_filename(file_name: str) -> str:
    stem = os.path.splitext(file_name)[0]
    stem = stem.replace("_", " ").replace("-", " ")
    return stem.strip() or "Untitled"


def main() -> int:
    ap = argparse.ArgumentParser(description="PDF → cleaned JSON (ad_law_files).")
    ap.add_argument(
        "--dir",
        default=DEFAULT_INPUT_DIR,
        help=f"Folder containing PDFs (default: {DEFAULT_INPUT_DIR})",
    )
    ap.add_argument(
        "--suffix",
        default=".cleaned.json",
        help="Output filename suffix (default: .cleaned.json → Act.cleaned.json)",
    )
    ap.add_argument("--dry-run", action="store_true", help="List PDFs only, do not write.")
    args = ap.parse_args()

    in_dir = os.path.abspath(args.dir)
    pdfs = _pdf_paths(in_dir)
    if not pdfs:
        print(f"No PDF files found in: {in_dir}", file=sys.stderr)
        print("Add .pdf files to that folder and run again.", file=sys.stderr)
        return 1

    print(f"Input directory: {in_dir}")
    print(f"Found {len(pdfs)} PDF(s).")

    for pdf_path in pdfs:
        file_name = os.path.basename(pdf_path)
        stem = _safe_json_stem(file_name)
        out_path = os.path.join(in_dir, stem + args.suffix)

        if args.dry_run:
            print(f"  [dry-run] {file_name} -> {os.path.basename(out_path)}")
            continue

        record = build_record(pdf_path, file_name)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        flag = "OK" if record.get("char_count", 0) else "WARN"
        print(f"  [{flag}] {file_name} -> {os.path.basename(out_path)} "
              f"({record.get('char_count', 0)} chars, title={record.get('act_title', '')[:60]!r})")

    if args.dry_run:
        print("Dry run complete; no files written.")
    else:
        print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
