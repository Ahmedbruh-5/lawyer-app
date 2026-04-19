# pak_laws.json -> RAG Corpus Build Report

_Generated in 15.1s_

## 1. Pipeline summary

| Stage | Value |
|---|---|
| Input records | 967 |
| Empty after cleaning | 0 |
| Repealed stubs dropped | 48 |
| 'Under review' stubs kept (flagged) | 0 |
| Exact text duplicates removed | 26 |
| '(n).pdf' copy duplicates removed | 1 |
| **Unique documents emitted** | **892** |
| **Chunks emitted** | **23,183** |
| Total chars across chunks | 36,095,910 |
| Estimated tokens | 9,023,977 |

## 2. Category distribution

| Category | Docs |
|---|---|
| general | 657 |
| education | 34 |
| corporate | 26 |
| health | 25 |
| criminal | 23 |
| judicial | 23 |
| labour | 21 |
| transport | 18 |
| commerce_trade | 17 |
| property_land | 15 |
| family | 7 |
| law_enforcement | 7 |
| elections_gov | 7 |
| environment | 5 |
| taxation | 5 |
| civil_service | 2 |

## 3. Status distribution

| Status | Docs |
|---|---|
| in_force | 892 |

## 4. Enactment decade distribution

| Decade | Docs |
|---|---|
| 1830s | 1 |
| 1850s | 10 |
| 1860s | 8 |
| 1870s | 22 |
| 1880s | 22 |
| 1890s | 25 |
| 1900s | 10 |
| 1910s | 18 |
| 1920s | 31 |
| 1930s | 27 |
| 1940s | 38 |
| 1950s | 48 |
| 1960s | 86 |
| 1970s | 150 |
| 1980s | 43 |
| 1990s | 42 |
| 2000s | 110 |
| 2010s | 121 |
| 2020s | 79 |

## 5. Chunk size distribution (chars)

| Size bucket | Chunks |
|---|---|
| <1k | 9687 |
| 1k-2k | 7651 |
| 2k-3k | 2670 |
| 3k-4k | 1977 |
| 4k-5k | 969 |
| >=5k | 229 |

## 6. Top 15 largest documents (by chunks)

| Doc ID | Act title | Chunks |
|---|---|---|
| `estacode-2021` | ESTACODE | 1454 |
| `the-code-of-civil-procedure-1908-1908` | THE CODE OF CIVIL PROCEDURE, 1908 | 581 |
| `the-companies-act-2017-2017` | THE COMPANIES ACT, 2017 | 570 |
| `the-comp-anies-ordinance-1984-1984` | THE COMP ANIES ORDINANCE, 1984 | 510 |
| `the-merchant-shipping-ordinance-2001-2001` | THE MERCHANT SHIPPING ORDINANCE, 2001 | 505 |
| `the-customs-act-1969-1969` | THE CUSTOMS ACT, 1969 | 386 |
| `the-income-tax-ordinance-2001-2001` | THE INCOME TAX ORDINANCE, 2001 | 368 |
| `the-pakistan-penal-code` | THE PAKISTAN PENAL CODE | 367 |
| `the-code-of-criminal-procedure-1898-1898` | THE CODE OF CRIMINAL PROCEDURE , 1898 | 357 |
| `the-succession-act-1925-1925` | THE SUCCESSION ACT, 1925 | 275 |
| `islamic-republic-2018` | ISLAMIC REPUBLIC | 257 |
| `the-cantonments-act-1924-1924` | THE CANTONMENTS ACT, 1924 | 250 |
| `the-cantonments-ordinance-2002-2002` | THE CANTONMENTS ORDINANCE, 2002 | 223 |
| `the-election-s-act-2017-2017` | THE ELECTION S ACT, 2017 | 202 |
| `scope-and-payment-of-tax-29-1990` | SCOPE AND PAYMENT OF TAX.................. ....................... ....29 | 173 |

## 7. Emitted files

- `pak_laws_cleaned.json` - document-level cleaned corpus (array of `{doc_id, act_title, year, status, category, updated_till, source_file, text, ...}`).
- `pak_laws_rag.jsonl` - JSONL, **one chunk per line**, ready for direct ingestion into Pinecone / Qdrant / Weaviate / pgvector / Chroma. Each line carries the parent metadata plus `chunk_id`, `section_ref`, `chunk_index`, `total_chunks`, `char_count`, `token_est`.
- `pak_laws_rag_report.md` - this file.

## 8. Ingestion snippet (Python, any vector DB)

```python
import json
with open('pak_laws_rag.jsonl', encoding='utf-8') as f:
    for line in f:
        chunk = json.loads(line)
        vector = embed(chunk['text'])          # your embedder
        upsert(id=chunk['chunk_id'],
               vector=vector,
               metadata={k: v for k, v in chunk.items() if k != 'text'},
               document=chunk['text'])
```
