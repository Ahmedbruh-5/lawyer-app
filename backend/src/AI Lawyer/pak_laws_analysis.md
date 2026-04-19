# Deep Analysis of `pak_laws.json`

Here is a full, evidence-based review of the knowledge base you plan to feed into your RAG-powered Virtual Lawyer chatbot.

## 1. Shape & Scale

| Property | Value |
|---|---|
| File size | 44.75 MB |
| Top-level type | JSON array |
| Number of records | **967** |
| Schema of every record | `{ "file_name": str, "text": str }` — nothing else |
| Source format | All 967 are `.pdf` (text-extracted) |
| Total characters | 43,912,626 |
| Total words (approx) | ~9.56 million |
| Estimated tokens | ~10.98 million |
| Embedding cost estimate | ~$0.22 (text-embedding-3-small) / ~$1.43 (text-embedding-3-large) |
| Projected RAG chunks @ ~2 KB each | ~22,500 |

So it's a **single flat list of scraped PDF dumps** — almost certainly from `pakistancode.gov.pk` (the file-name pattern `administrator<md5>.pdf` is their CMS signature).

## 2. Content Coverage

Sample of real titles extracted from the text (cleaned):

- The Constitution… (474 hits for "constitution")
- The Pakistan Penal Code, Criminal Procedure Code, Evidence Order, Contract Act
- Privatisation Commission Ordinance 2000
- Prisons Act 1894, Post Office Act 1898, Limitation Act 1908
- Reformatory Schools Act 1897, Dekkhan Agriculturists' Relief Act 1879
- Trade Organizations Act 2013, PEMRA, Right of Access to Information Act 2017
- Dozens of university / body-specific statutes (NUCES, National Skills University, Allied Health Professionals Council, etc.)

**Topical keyword hits (across all 967 docs):**

| Topic | Hits | Remark |
|---|---|---|
| constitution | 474 | strong |
| evidence / penal code / CrPC | 274 / 164 / 151 | reasonable |
| companies / tax / banking | 210 / 181 / 82 | acceptable |
| women / children / family | 106 / 88 / 127 | present but thin |
| narcotics | 15 | weak (CNSA 1997 is critical for Pak criminal law) |
| anti-terrorism | 6 | weak (ATA 1997 is one of the most-asked laws) |
| hudood / qisas / khula / nikah | 10 / 2 / 2 / 3 | **almost absent** |
| cybercrime / PECA | 1 / 0 | **missing** — huge gap for a 2026 chatbot |

Years cited most in document headers cluster around 1950–2002 with a tail into 2023, i.e. the corpus is **statute-heavy and historically biased**; recent amendments may be under-represented.

## 3. Critical Quality Problems

These are the issues that will directly hurt retrieval quality and answer faithfulness.

### 3.1 Zero structured metadata
Every record has **only** `file_name` + `text`. There is no title, act name, year, section, chapter, jurisdiction, URL, category, or "in-force / repealed" flag. For a legal RAG system this is a major liability:

- Filtered retrieval (e.g. "only criminal statutes", "only in-force laws") is impossible.
- Citations back to the user will have to be reconstructed from noisy text headings.
- Re-ranking by recency / jurisdiction isn't possible.

### 3.2 Opaque filenames
956 / 967 filenames are `administrator<md5>.pdf` — they carry **no semantic signal**. Only 11 have human-readable names (`THE POST OFFICE ACT, 1898.pdf`, etc.). Filename is effectively useless as a retrieval feature.

### 3.3 PDF-extraction artifacts everywhere
- `821/967` records contain `Page X of Y` markers inline — will poison embeddings and bleed into model answers.
- `362/967` records have runs of 5+ spaces (column/table artifacts).
- `114` records show **OCR-like character fragmentation**, e.g. `T H E   P R I S O N S   A C T ,   1 8 9 4`. An embedding model will not match these against a user query like "Prisons Act 1894". This is the single most damaging issue for retrieval.
- `324` records have >2% non-ASCII characters — mostly mojibake (`�` replacing en-dashes, long-dashes, or section marks). Example in the very first doc: `PART I.�GENERAL`.
- `126` records contain `Updated till DD.MM.YYYY` stamps that should become structured metadata, not remain buried in prose.

### 3.4 Duplicate and placeholder records
- **48 records** contain only the string `"THIS LAW HAS BEEN REPEALED"` (28 chars). They are dead weight and, worse, will match queries about those repealed titles and produce empty answers.
- **27 records are exact text duplicates** (MD5-identical).
- **26 filenames** follow the `... (1).pdf` / `(2).pdf` pattern — scraper re-download duplicates. Confirmed example: records 488 and 489 are both 1,284,720 chars of the same content.
- 52 records have < 1 KB of text (likely PDF-extraction failures or cover pages).

### 3.5 Extreme size skew
- min 28 chars, max **2,578,313 chars** (one document is ~2.6 MB of text).
- 6 records are over 1 MB each — these are probably bundled code compendia, not single acts. Naïve chunking will scatter their context across thousands of chunks with no act-level grouping.

### 3.6 Language gaps
- Only **3 records** contain any Urdu / Arabic script. A Pakistani end-user app will receive plenty of Urdu questions; the KB has essentially no Urdu content and no bilingual mapping.
- No case law / judgments, no commentaries, no procedural forms, no FAQs — only raw statutes. That's a real UX gap for a "Virtual Lawyer" aimed at laypeople asking *"what's the punishment for X?"* or *"how do I file Y?"*.

## 4. What Is Good
- Single-file, valid JSON, UTF-8, loads cleanly in ~5 s — trivial to ingest.
- Broad federal-statute coverage (constitution, PPC, CrPC, Evidence, Companies, many sectoral acts).
- Volume (~11 M tokens) is comfortably within RAG scale; embedding cost is negligible (< $1.50 even with the large model).
- `Updated till` stamps exist in headers for 126 docs — recoverable as `as_of_date` metadata.
- Most documents preserve the TOC / section numbering (e.g. `SECTION 1. Short title, extent and commencement.`), which enables **section-level chunking** — the right granularity for a legal bot.

## 5. Concrete Recommendations Before You Index

Do these *before* computing embeddings. Cleaning after indexing is expensive.

1. **Normalize the corpus into a richer schema.** Target shape per chunk:
   ```json
   {
     "doc_id": "ppc-1860",
     "act_title": "The Pakistan Penal Code, 1860",
     "year": 1860,
     "category": "criminal",
     "status": "in_force",
     "updated_till": "2023-08-03",
     "section_number": "302",
     "section_heading": "Punishment of qatl-i-amd",
     "text": "…",
     "source_file": "administrator....pdf",
     "source_url": "https://pakistancode.gov.pk/…"
   }
   ```
2. **Title extraction pass.** For every record, extract the first real heading (e.g. `THE PRIVATISATION COMMISSION ORDINANCE, 2000`) into `act_title` + `year`. The current data proves this is doable — the pattern `THE … ACT|ORDINANCE, YYYY` hits on the vast majority.
3. **Drop the 48 "THIS LAW HAS BEEN REPEALED" stubs** (or mark `status: "repealed"` and exclude from retrieval by default).
4. **De-duplicate** the 27 exact duplicates and the 26 `(1).pdf`-style copies; keep the most recent.
5. **Fix the letter-spaced OCR garbage** — run a regex like `/(?:(?<=\s)|^)([A-Za-z])\s(?=[A-Za-z](?:\s|$))/g` collapsing single-letter + space sequences back into words. This alone will fix 114 documents.
6. **Repair mojibake.** Most `�` characters come from the en-dash (–), em-dash (—), and section sign (§). Replace predictably.
7. **Strip page furniture.** Remove `Page \d+ of \d+`, repeated running-headers, and multi-space runs before chunking.
8. **Chunk by section, not by token count.** Legal text is naturally section-delimited. Split on `^\s*\d+[A-Z]?\.\s` boundaries and only fall back to a 400–800 token sliding window when a section is oversized.
9. **Attach dense citation metadata to each chunk.** Your chatbot's biggest trust lever will be returning answers like *"Under Section 302 of the Pakistan Penal Code, 1860 (updated till 3-Aug-2022), the punishment is…"*. The raw data supports that only if you extract the metadata now.
10. **Fill the coverage gaps.** Before release, explicitly verify the KB contains: PECA 2016, ATA 1997, CNSA 1997, Hudood Ordinances, Muslim Family Laws Ordinance 1961, Dissolution of Muslim Marriages Act 1939, Punjab/Sindh/KP/Balochistan police & tenancy laws, Consumer Protection Acts (provincial), Motor Vehicles Ordinance. Several of these register as weak or zero in the keyword audit.
11. **Plan for Urdu.** Either add Urdu translations to each document or front the chatbot with a query-translation + answer-translation layer. With only 3 Urdu-bearing docs today, monolingual retrieval from the KB won't serve Urdu queries directly.
12. **Add a "repealed / in-force" guard in the system prompt.** Even after cleaning, the model must never quote a repealed act as current law — the corpus clearly contains historical statutes (1879, 1894, 1898, 1908, …).

## 6. Bottom-Line Remark

The file is a **decent raw ingest of Pakistan's federal statute book** and is workable as a starting corpus — but in its current shape it is not RAG-ready. The three problems that will most visibly degrade chatbot quality are:

1. **No structured metadata** → no filtering, no reliable citations.
2. **PDF / OCR noise** (page markers, letter-spacing, mojibake) → poor semantic retrieval recall on exactly the kinds of queries end-users type (act names, section numbers).
3. **Missing modern & high-demand laws** (PECA, ATA, CNSA, family-law ordinances, Urdu content) → the bot will confidently fail on the most common user questions.

Invest the cleaning + enrichment pass described in §5 *before* you embed. The embedding and hosting costs are trivial (~$1.50); the data-quality debt, if carried forward, will show up as wrong or non-responsive answers in every demo.
