"""
Build a 100% RAG-ready corpus from pak_laws.json.

Input  (read-only, never modified):
    pak_laws.json  - array of { file_name, text } scraped from pakistancode.gov.pk

Outputs (new files, written alongside the input):
    pak_laws_cleaned.json   - document-level cleaned + enriched metadata
    pak_laws_rag.jsonl      - one chunk per line, ready for embedding / vector DB
    pak_laws_rag_report.md  - processing report with before/after numbers

Pipeline stages
---------------
1. Load corpus, validate schema.
2. Per-document text cleaning
      - repair mojibake (U+FFFD, stray latin-1 artefacts)
      - collapse letter-spaced OCR (T H E  ->  THE) while preserving word
        boundaries that were marked by the mojibake char
      - strip "Page X of Y" markers, running headers, duplicate whitespace
      - normalize unicode to NFKC
3. Metadata extraction
      - act_title, year, updated_till, status (in_force / repealed / under_review),
        category (criminal / constitutional / family / taxation / ...), doc_id slug
4. Deduplication
      - drop the 48 "THIS LAW HAS BEEN REPEALED" stubs (kept as a manifest)
      - drop exact-text duplicates (md5) keeping the first occurrence
      - drop scraper copies like "... (1).pdf" when identical text already exists
5. Section-aware chunking
      - split by statutory section markers (  1. / 12A. / ...) and "PART" headings
      - target ~1000 tokens / ~4000 chars per chunk with 150-char overlap
      - oversized sections fall back to sliding-window chunks
      - each chunk carries full parent metadata + section_ref + chunk_index
6. Emit JSONL + JSON + Markdown report.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import time
import unicodedata
from collections import Counter, defaultdict
from typing import Any

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

WORKSPACE      = r"d:\AI Lawyer"
INPUT_PATH     = os.path.join(WORKSPACE, "pak_laws.json")
OUT_CLEAN_JSON = os.path.join(WORKSPACE, "pak_laws_cleaned.json")
OUT_RAG_JSONL  = os.path.join(WORKSPACE, "pak_laws_rag.jsonl")
OUT_REPORT_MD  = os.path.join(WORKSPACE, "pak_laws_rag_report.md")

TARGET_CHUNK_CHARS = 4000    # ~1000 tokens
MAX_CHUNK_CHARS    = 6000    # hard ceiling
MIN_CHUNK_CHARS    = 400     # tiny sections get merged upward
CHUNK_OVERLAP      = 200     # sliding-window overlap for oversized sections


# -----------------------------------------------------------------------------
# 1. Text-cleaning helpers
# -----------------------------------------------------------------------------

# Common mojibake replacements we are confident about.
# The U+FFFD replacement char in this corpus almost always stood in for a
# dash / bullet / section mark. We collapse it to a hyphen when it joins
# word fragments, otherwise to a space (word separator).
MOJIBAKE_TOKEN = "\ufffd"

RE_PAGE_MARKER   = re.compile(r"\s*Page\s+\d+\s+of\s+\d+\s*", re.IGNORECASE)
RE_MULTI_SPACE   = re.compile(r"[ \t]{2,}")
RE_MULTI_NEWLINE = re.compile(r"\n{3,}")
RE_TRAIL_WS      = re.compile(r"[ \t]+\n")
RE_NULL          = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

# Characters that must be stripped entirely: they are invisible or
# embedding-hostile (they fragment subword tokens for most tokenizers and
# never carry meaning in legal text).
RE_INVISIBLE = re.compile(
    r"[\u00ad\u200b\u200c\u200d\u2060\ufeff]"
    r"|[\ue000-\uf8ff]"          # Private Use Area - PDF font glyph leaks
    r"|[\u0300-\u036f]"          # combining diacritical marks (typewriter underlines etc.)
    r"|[\u0483-\u0489]"          # combining marks cyrillic
    r"|[\u2580-\u259f]"          # block drawing
)

# Character-level canonicalisation for retrieval consistency.
# Curly quotes, typographic dashes, bullets, etc. all map to ASCII
# equivalents so a user query like "sub-section" matches the corpus.
_CHAR_MAP = {
    # Quotes
    "\u2018": "'", "\u2019": "'", "\u201a": "'", "\u201b": "'",
    "\u201c": '"', "\u201d": '"', "\u201e": '"', "\u201f": '"',
    "\u2039": "<", "\u203a": ">", "\u00ab": '"', "\u00bb": '"',
    # Dashes / hyphens / horizontal bars
    "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-",
    "\u2014": "-", "\u2015": "-", "\u2212": "-",
    "\u2e3a": "--", "\u2e3b": "---", "\u23af": "-", "\u2500": "-",
    # Bullets and dots
    "\u2022": "* ", "\u00b7": ".", "\u25cf": "* ", "\u2043": "- ",
    # Spaces
    "\u00a0": " ", "\u2002": " ", "\u2003": " ", "\u2004": " ",
    "\u2005": " ", "\u2006": " ", "\u2007": " ", "\u2008": " ",
    "\u2009": " ", "\u202f": " ", "\u205f": " ", "\u3000": " ",
    # Misc
    "\u2044": "/", "\u2264": "<=", "\u2265": ">=",
    "\u00d7": "x", "\u2016": "||",
}
_TRANS = str.maketrans(_CHAR_MAP)

# Heuristic: line is "letter-spaced" if >= 50 % of its tokens are single alnum
# chars and it has at least 6 such tokens.
def _is_letter_spaced(line: str) -> bool:
    tokens = [t for t in line.split(" ") if t]
    if len(tokens) < 6:
        return False
    single = sum(1 for t in tokens if len(t) == 1 and t.isalnum())
    return single / len(tokens) >= 0.5


def _collapse_letter_spaced_line(line: str) -> str:
    """
    Given a letter-spaced line like
        'T H E   P R I S O N S   A C T ,   1 8 9 4'
    (where original word boundaries came through as runs of 2+ spaces, often
    because the source used U+FFFD which we already replaced with a space)
    return 'THE PRISONS ACT, 1894'.
    """
    # 1. Mark runs of 2+ spaces (word boundaries) with a sentinel.
    marked = re.sub(r" {2,}", "\x1f", line)
    # 2. Remove the single spaces that separate individual letters.
    marked = marked.replace(" ", "")
    # 3. Restore word boundaries.
    return marked.replace("\x1f", " ")


def _repair_mojibake(text: str) -> str:
    """
    U+FFFD appears between words in this corpus far more often than inside
    words. Replace it with a space; the downstream whitespace collapser will
    tidy up.
    """
    # When the mojibake char has no surrounding spaces but is flanked by
    # letters, it's almost always a hyphen/dash inside a compound word.
    text = re.sub(r"(?<=\w)" + MOJIBAKE_TOKEN + r"(?=\w)", "-", text)
    # Otherwise treat it as a word separator.
    text = text.replace(MOJIBAKE_TOKEN, " ")
    return text


def clean_text(raw: str) -> str:
    if not raw:
        return ""
    text = unicodedata.normalize("NFKC", raw)
    text = RE_NULL.sub("", text)
    text = RE_INVISIBLE.sub("", text)         # soft hyphens, ZWSP, PUA
    text = text.translate(_TRANS)             # curly quotes / dashes -> ASCII
    text = _repair_mojibake(text)
    text = RE_PAGE_MARKER.sub(" ", text)

    # Normalise line endings first.
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Fix letter-spaced lines one at a time.
    fixed_lines = []
    for line in text.split("\n"):
        if _is_letter_spaced(line):
            fixed_lines.append(_collapse_letter_spaced_line(line))
        else:
            fixed_lines.append(line)
    text = "\n".join(fixed_lines)

    # Collapse excess whitespace.
    text = RE_TRAIL_WS.sub("\n", text)
    text = RE_MULTI_SPACE.sub(" ", text)
    text = RE_MULTI_NEWLINE.sub("\n\n", text)
    text = text.strip()
    return text


# -----------------------------------------------------------------------------
# 2. Metadata extraction
# -----------------------------------------------------------------------------

RE_UPDATED_TILL = re.compile(
    r"Updated\s+till\s+([0-9]{1,2}[.\-/][0-9]{1,2}[.\-/][0-9]{2,4})",
    re.IGNORECASE,
)
RE_YEAR         = re.compile(r"\b(1[89]\d{2}|20\d{2})\b")
RE_ACT_LINE     = re.compile(
    r"^\s*((?:THE\s+)?[A-Z0-9][A-Z0-9 ,'()&\-./]{3,200}?"
    r"(?:ACT|ORDINANCE|CODE|RULES|REGULATIONS|ORDER|LAW|CONSTITUTION|ESTACODE)"
    r"[A-Z0-9 ,'()&\-./]*?(?:,\s*\d{4})?)\s*$",
    re.MULTILINE,
)
RE_SHORT_TITLE  = re.compile(
    r'(?:may\s+be\s+called|shall\s+be\s+called)\s+(?:the\s+)?'
    r'([^.\n]{5,150}?(?:Act|Ordinance|Code|Order|Rules|Regulations),?\s*\d{4})',
    re.IGNORECASE,
)

# Cover-page boilerplate that should NOT be treated as a document title.
TITLE_BLOCKLIST = {
    "for official use", "prepared & published by", "prepared and published by",
    "government of pakistan", "all rights reserved", "copyright",
    "ministry of law", "contents", "table of contents", "foreword",
    "preface", "index", "chapter contents", "printed by",
    "islamabad", "cabinet secretariat", "establishment division",
    "under review", "this law has been repealed",
}


CATEGORY_KEYWORDS = [
    ("constitutional", ["constitution"]),
    ("criminal",       ["penal code", "criminal procedure", "criminal law",
                        "anti-terrorism", "narcotic", "hudood", "qisas", "diyat",
                        "offence", "prevention of"]),
    ("family",         ["muslim family", "dissolution of muslim marriage",
                        "child marriage", "guardians and wards", "nikah",
                        "divorce", "christian marriage", "dowry"]),
    ("taxation",       ["income tax", "sales tax", "customs", "federal excise",
                        "tax ordinance", "tax act", "revenue"]),
    ("corporate",      ["companies act", "companies ordinance", "securities",
                        "banking", "corporate", "partnership", "insurance",
                        "bankers", "financial institutions"]),
    ("labour",         ["labour", "employees", "workmen", "industrial relations",
                        "factories act", "minimum wages", "employment"]),
    ("property_land",  ["land acquisition", "tenancy", "tenement", "rent",
                        "registration act", "transfer of property",
                        "land revenue", "agricultural"]),
    ("law_enforcement",["police", "rangers", "frontier corps", "coast guard",
                        "border force", "motorway police"]),
    ("judicial",       ["judicial", "court", "tribunal", "limitation act",
                        "evidence", "civil procedure", "arbitration"]),
    ("civil_service",  ["estacode", "civil servant", "civil service",
                        "public administration", "establishment division",
                        "government servants", "service tribunal"]),
    ("education",      ["university", "education", "college", "school",
                        "examination", "curriculum"]),
    ("health",         ["health", "medical", "hospital", "drug", "pharmac",
                        "blood", "transplant"]),
    ("transport",      ["motor vehicle", "traffic", "railway", "shipping",
                        "ports act", "civil aviation", "carriage"]),
    ("commerce_trade", ["trade", "import", "export", "competition",
                        "consumer", "intellectual property", "trademark",
                        "patent", "copyright"]),
    ("elections_gov",  ["election", "senate", "national assembly",
                        "provincial assembly", "representation of the people"]),
    ("environment",    ["environment", "forest", "wildlife", "fisheries",
                        "pollution"]),
]


def _slugify(value: str, maxlen: int = 60) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").lower()
    return value[:maxlen] or "doc"


def _is_boilerplate(s: str) -> bool:
    low = re.sub(r"[^a-z ]", " ", s.lower())
    low = re.sub(r"\s+", " ", low).strip()
    if low in TITLE_BLOCKLIST:
        return True
    for bad in TITLE_BLOCKLIST:
        if bad in low and len(low) <= len(bad) + 12:
            return True
    return False


def _extract_title(text: str) -> str:
    """
    Best-guess title. Strategy:
      1. Explicit ACT / ORDINANCE / CODE / RULES / REGULATIONS headline in
         the first 12 KB of cleaned text - skipping cover-page boilerplate.
      2. "may be called the ... Act, YYYY" short-title clause.
      3. First all-caps multi-word line (PDF title pages tend to be capitalised).
      4. First non-trivial non-boilerplate line.
    """
    head = text[:12000]

    for m in RE_ACT_LINE.finditer(head):
        candidate = re.sub(r"\s+", " ", m.group(1)).strip(" .,")
        if not _is_boilerplate(candidate) and len(candidate) >= 6:
            return candidate

    m = RE_SHORT_TITLE.search(head)
    if m:
        cand = re.sub(r"\s+", " ", m.group(1)).strip(" .,").title()
        if not _is_boilerplate(cand):
            return cand

    for line in head.split("\n"):
        s = line.strip().strip(",.;:")
        if 12 <= len(s) <= 200 and not _is_boilerplate(s):
            letters = [c for c in s if c.isalpha()]
            if len(letters) >= 10 and sum(1 for c in letters if c.isupper()) / len(letters) >= 0.7:
                words = s.split()
                if len(words) >= 2 and not s.isdigit():
                    return re.sub(r"\s+", " ", s)[:200]

    for line in head.split("\n"):
        s = line.strip()
        if len(s) >= 8 and any(c.isalpha() for c in s) and not _is_boilerplate(s):
            return re.sub(r"\s+", " ", s)[:200]
    return ""


def _extract_year(title: str, text: str) -> int | None:
    for source in (title, text[:2000]):
        m = RE_YEAR.search(source)
        if m:
            y = int(m.group(1))
            if 1800 <= y <= 2100:
                return y
    return None


def _extract_updated_till(text: str) -> str | None:
    m = RE_UPDATED_TILL.search(text[:5000])
    return m.group(1) if m else None


def _classify(title: str) -> str:
    t = title.lower()
    for label, keys in CATEGORY_KEYWORDS:
        if any(k in t for k in keys):
            return label
    return "general"


def _status(text: str) -> str:
    head = text[:500].upper()
    if "THIS LAW HAS BEEN REPEALED" in head:
        return "repealed"
    if "UNDER REVIEW" in head and len(text) < 200:
        return "under_review"
    return "in_force"


def _cleanup_title(t: str) -> str:
    # Trim any leading footnote markers like "1[" or trailing "]1" fragments.
    t = re.sub(r"^\d+\s*\[", "[", t)
    t = re.sub(r"^\[|\]$", "", t).strip()
    # Collapse stray whitespace inside broken words ("Ordin Ance" -> "Ordinance").
    # Very conservative: only when two short tokens would form a known legal word.
    for good in ("ORDINANCE", "Ordinance", "ordinance"):
        for bad in re.findall(r"\b[A-Za-z]{2,6}\s[A-Za-z]{2,6}\b", t):
            if bad.replace(" ", "").lower() == good.lower():
                t = t.replace(bad, good)
    # Final sanity: truncate absurdly long titles at the first year if present.
    if len(t) > 150:
        m = re.search(r"\b(1[89]\d{2}|20\d{2})\b", t)
        if m:
            t = t[: m.end()]
    return re.sub(r"\s+", " ", t)[:200].strip(" .,-")


def extract_metadata(file_name: str, cleaned_text: str) -> dict[str, Any]:
    title = _cleanup_title(_extract_title(cleaned_text))
    year  = _extract_year(title, cleaned_text)
    meta  = {
        "source_file":  file_name,
        "act_title":    title or "Untitled",
        "year":         year,
        "updated_till": _extract_updated_till(cleaned_text),
        "status":       _status(cleaned_text),
        "category":     _classify(title),
        "char_count":   len(cleaned_text),
        "token_est":    max(1, len(cleaned_text) // 4),
    }
    base = title if title else os.path.splitext(file_name)[0]
    meta["doc_id"] = _slugify(f"{base}-{year}" if year else base)
    return meta


# -----------------------------------------------------------------------------
# 3. Section-aware chunking
# -----------------------------------------------------------------------------

# Matches a new statutory section at line start, e.g.
#     1. Short title, extent and commencement.
#     12A. Interpretation.-
#     302-A. Punishment of ...
RE_SECTION_HEAD = re.compile(
    r"(?m)^\s*(\d{1,4}[A-Z]{0,2}(?:-[A-Z0-9]{1,4})?)\.\s+(?=[A-Z\"\u201c])"
)

# "PART III.-JURISDICTION"  or  "CHAPTER IV ..."
RE_PART_HEAD = re.compile(
    r"(?m)^\s*(PART|CHAPTER|SCHEDULE)\s+([IVXLCDM0-9]+[A-Z]?)\b[.\-:\s]*(.{0,120})"
)


def split_by_sections(text: str) -> list[tuple[str, str]]:
    """
    Return a list of (section_ref, body) tuples.
    section_ref is either 'preamble', 'Part III', 'Section 12A', etc.
    """
    parts: list[tuple[int, str, int]] = []  # (position, ref, kind 0=part 1=section)

    for m in RE_PART_HEAD.finditer(text):
        parts.append((m.start(), f"{m.group(1).title()} {m.group(2)}", 0))
    for m in RE_SECTION_HEAD.finditer(text):
        parts.append((m.start(), f"Section {m.group(1)}", 1))

    if not parts:
        return [("preamble", text)]

    parts.sort(key=lambda x: x[0])

    sections: list[tuple[str, str]] = []
    if parts[0][0] > 0:
        pre = text[: parts[0][0]].strip()
        if pre:
            sections.append(("preamble", pre))

    # Track current part for context, attach to section refs.
    current_part = ""
    for i, (pos, ref, kind) in enumerate(parts):
        end = parts[i + 1][0] if i + 1 < len(parts) else len(text)
        body = text[pos:end].strip()
        if not body:
            continue
        if kind == 0:  # PART
            current_part = ref
            sections.append((ref, body))
        else:
            full_ref = f"{current_part} / {ref}" if current_part else ref
            sections.append((full_ref, body))
    return sections


def sliding_window(text: str, target: int, overlap: int) -> list[str]:
    """Split an oversized block into overlapping windows at sentence boundaries
    when possible."""
    if len(text) <= target:
        return [text]
    out = []
    i = 0
    n = len(text)
    while i < n:
        end = min(i + target, n)
        if end < n:
            # try to break at a sentence end within the last 400 chars
            window = text[i:end]
            m = list(re.finditer(r"[.!?]\s+[A-Z(\"]", window))
            if m and m[-1].start() > target - 600:
                end = i + m[-1].start() + 1
        out.append(text[i:end].strip())
        if end == n:
            break
        i = max(end - overlap, i + 1)
    return [c for c in out if c]


def chunk_document(cleaned: str,
                   meta: dict[str, Any]) -> list[dict[str, Any]]:
    sections = split_by_sections(cleaned)

    # Merge tiny adjacent sections upward to MIN_CHUNK_CHARS; split oversized.
    merged: list[tuple[str, str]] = []
    buf_ref, buf_txt = None, ""
    for ref, body in sections:
        if len(body) < MIN_CHUNK_CHARS and buf_txt and len(buf_txt) < TARGET_CHUNK_CHARS:
            buf_txt += "\n\n" + body
            continue
        if buf_txt:
            merged.append((buf_ref, buf_txt))
        buf_ref, buf_txt = ref, body
    if buf_txt:
        merged.append((buf_ref, buf_txt))

    chunks: list[dict[str, Any]] = []
    for ref, body in merged:
        pieces = sliding_window(body, TARGET_CHUNK_CHARS, CHUNK_OVERLAP) \
                 if len(body) > MAX_CHUNK_CHARS else [body]
        for piece in pieces:
            chunks.append({"section_ref": ref, "text": piece})
    return chunks


# -----------------------------------------------------------------------------
# 4. Pipeline driver
# -----------------------------------------------------------------------------

def main() -> int:
    t0 = time.time()
    print(f"[1/6] Loading {INPUT_PATH} ...")
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    print(f"       loaded {len(raw):,} records")

    stats = {
        "records_in":        len(raw),
        "repealed_dropped":  0,
        "under_review":      0,
        "exact_dupes":       0,
        "copy_suffix_dupes": 0,
        "empty_after_clean": 0,
        "docs_out":          0,
        "chunks_out":        0,
        "total_chars_out":   0,
        "category_counts":   Counter(),
        "status_counts":     Counter(),
        "year_counts":       Counter(),
    }

    print("[2/6] Cleaning text and extracting metadata ...")
    cleaned_docs: list[dict[str, Any]] = []
    for i, rec in enumerate(raw):
        cleaned = clean_text(rec.get("text", ""))
        if not cleaned:
            stats["empty_after_clean"] += 1
            continue
        meta = extract_metadata(rec.get("file_name", f"doc_{i}"), cleaned)
        cleaned_docs.append({**meta, "text": cleaned})

    print(f"       kept {len(cleaned_docs):,} docs after cleaning")

    print("[3/6] Deduplicating ...")
    seen_hashes: dict[str, int] = {}
    deduped: list[dict[str, Any]] = []
    for d in cleaned_docs:
        if d["status"] == "repealed":
            stats["repealed_dropped"] += 1
            continue
        if d["status"] == "under_review":
            stats["under_review"] += 1
        h = hashlib.md5(d["text"].encode("utf-8", "ignore")).hexdigest()
        if h in seen_hashes:
            if re.search(r"\(\d+\)\.pdf$", d["source_file"]):
                stats["copy_suffix_dupes"] += 1
            else:
                stats["exact_dupes"] += 1
            continue
        seen_hashes[h] = len(deduped)
        deduped.append(d)

    # Ensure unique doc_ids after dedupe.
    id_counter: Counter[str] = Counter()
    for d in deduped:
        base = d["doc_id"]
        id_counter[base] += 1
        if id_counter[base] > 1:
            d["doc_id"] = f"{base}-{id_counter[base]}"

    print(f"       kept {len(deduped):,} unique non-repealed docs")

    print("[4/6] Chunking ...")
    chunks_all: list[dict[str, Any]] = []
    for d in deduped:
        stats["category_counts"][d["category"]] += 1
        stats["status_counts"][d["status"]]     += 1
        if d.get("year"):
            decade = (d["year"] // 10) * 10
            stats["year_counts"][f"{decade}s"] += 1

        pieces = chunk_document(d["text"], d)
        for idx, ch in enumerate(pieces):
            body = ch["text"]
            chunk_id = f"{d['doc_id']}::chunk-{idx:04d}"
            chunks_all.append({
                "chunk_id":      chunk_id,
                "doc_id":        d["doc_id"],
                "act_title":     d["act_title"],
                "year":          d["year"],
                "category":      d["category"],
                "status":        d["status"],
                "updated_till":  d["updated_till"],
                "source_file":   d["source_file"],
                "section_ref":   ch["section_ref"],
                "chunk_index":   idx,
                "char_count":    len(body),
                "token_est":     max(1, len(body) // 4),
                "text":          body,
            })

    # Second pass: total_chunks per doc.
    per_doc_counts: Counter[str] = Counter(c["doc_id"] for c in chunks_all)
    for c in chunks_all:
        c["total_chunks"] = per_doc_counts[c["doc_id"]]

    stats["docs_out"]        = len(deduped)
    stats["chunks_out"]      = len(chunks_all)
    stats["total_chars_out"] = sum(c["char_count"] for c in chunks_all)

    print(f"       produced {len(chunks_all):,} chunks "
          f"(avg {stats['total_chars_out']//max(1,len(chunks_all))} chars)")

    print("[5/6] Writing output files ...")
    # Pretty JSON for document-level (easier to inspect).
    with open(OUT_CLEAN_JSON, "w", encoding="utf-8") as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)

    # JSONL for chunks - 1 chunk per line, ideal for streaming into vector DBs.
    with open(OUT_RAG_JSONL, "w", encoding="utf-8") as f:
        for c in chunks_all:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")

    print("[6/6] Writing report ...")
    write_report(stats, deduped, chunks_all, time.time() - t0)

    size_clean = os.path.getsize(OUT_CLEAN_JSON) / 1024 / 1024
    size_jsonl = os.path.getsize(OUT_RAG_JSONL)  / 1024 / 1024
    print(f"\nDone in {time.time()-t0:.1f}s")
    print(f"  {OUT_CLEAN_JSON}   {size_clean:6.2f} MB   {len(deduped):,} docs")
    print(f"  {OUT_RAG_JSONL}    {size_jsonl:6.2f} MB   {len(chunks_all):,} chunks")
    print(f"  {OUT_REPORT_MD}")
    return 0


def write_report(stats: dict[str, Any],
                 docs:  list[dict[str, Any]],
                 chunks: list[dict[str, Any]],
                 elapsed: float) -> None:
    lines: list[str] = []
    A = lines.append

    A("# pak_laws.json -> RAG Corpus Build Report\n")
    A(f"_Generated in {elapsed:.1f}s_\n")
    A("## 1. Pipeline summary\n")
    A("| Stage | Value |")
    A("|---|---|")
    A(f"| Input records | {stats['records_in']:,} |")
    A(f"| Empty after cleaning | {stats['empty_after_clean']:,} |")
    A(f"| Repealed stubs dropped | {stats['repealed_dropped']:,} |")
    A(f"| 'Under review' stubs kept (flagged) | {stats['under_review']:,} |")
    A(f"| Exact text duplicates removed | {stats['exact_dupes']:,} |")
    A(f"| '(n).pdf' copy duplicates removed | {stats['copy_suffix_dupes']:,} |")
    A(f"| **Unique documents emitted** | **{stats['docs_out']:,}** |")
    A(f"| **Chunks emitted** | **{stats['chunks_out']:,}** |")
    A(f"| Total chars across chunks | {stats['total_chars_out']:,} |")
    A(f"| Estimated tokens | {stats['total_chars_out']//4:,} |\n")

    A("## 2. Category distribution\n")
    A("| Category | Docs |")
    A("|---|---|")
    for cat, n in sorted(stats["category_counts"].items(), key=lambda x: -x[1]):
        A(f"| {cat} | {n} |")
    A("")

    A("## 3. Status distribution\n")
    A("| Status | Docs |")
    A("|---|---|")
    for s, n in stats["status_counts"].items():
        A(f"| {s} | {n} |")
    A("")

    A("## 4. Enactment decade distribution\n")
    A("| Decade | Docs |")
    A("|---|---|")
    for dec, n in sorted(stats["year_counts"].items()):
        A(f"| {dec} | {n} |")
    A("")

    A("## 5. Chunk size distribution (chars)\n")
    bucket = Counter()
    for c in chunks:
        cc = c["char_count"]
        if   cc <  1000: bucket["<1k"]       += 1
        elif cc <  2000: bucket["1k-2k"]     += 1
        elif cc <  3000: bucket["2k-3k"]     += 1
        elif cc <  4000: bucket["3k-4k"]     += 1
        elif cc <  5000: bucket["4k-5k"]     += 1
        else:            bucket[">=5k"]      += 1
    A("| Size bucket | Chunks |")
    A("|---|---|")
    for k in ["<1k", "1k-2k", "2k-3k", "3k-4k", "4k-5k", ">=5k"]:
        A(f"| {k} | {bucket.get(k,0)} |")
    A("")

    A("## 6. Top 15 largest documents (by chunks)\n")
    per_doc: Counter[str] = Counter()
    title_by: dict[str, str] = {}
    for c in chunks:
        per_doc[c["doc_id"]] += 1
        title_by[c["doc_id"]] = c["act_title"]
    A("| Doc ID | Act title | Chunks |")
    A("|---|---|---|")
    for doc_id, n in per_doc.most_common(15):
        A(f"| `{doc_id}` | {title_by[doc_id][:100]} | {n} |")
    A("")

    A("## 7. Emitted files\n")
    A(f"- `{os.path.basename(OUT_CLEAN_JSON)}` - document-level cleaned corpus "
      f"(array of `{{doc_id, act_title, year, status, category, "
      f"updated_till, source_file, text, ...}}`).")
    A(f"- `{os.path.basename(OUT_RAG_JSONL)}` - JSONL, **one chunk per line**, "
      f"ready for direct ingestion into Pinecone / Qdrant / Weaviate / "
      f"pgvector / Chroma. Each line carries the parent metadata plus "
      f"`chunk_id`, `section_ref`, `chunk_index`, `total_chunks`, "
      f"`char_count`, `token_est`.")
    A(f"- `{os.path.basename(OUT_REPORT_MD)}` - this file.\n")

    A("## 8. Ingestion snippet (Python, any vector DB)\n")
    A("```python")
    A("import json")
    A("with open('pak_laws_rag.jsonl', encoding='utf-8') as f:")
    A("    for line in f:")
    A("        chunk = json.loads(line)")
    A("        vector = embed(chunk['text'])          # your embedder")
    A("        upsert(id=chunk['chunk_id'],")
    A("               vector=vector,")
    A("               metadata={k: v for k, v in chunk.items() if k != 'text'},")
    A("               document=chunk['text'])")
    A("```")
    A("")

    with open(OUT_REPORT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    sys.exit(main())
