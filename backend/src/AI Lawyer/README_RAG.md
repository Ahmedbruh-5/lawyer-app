# AI Lawyer - RAG Pipeline

A complete retrieval-augmented-generation pipeline for a Pakistani-law virtual
lawyer chatbot, built on **LangChain + HuggingFace embeddings + FAISS**.
Generation uses **Google Gemini (free tier)** by default; swap in any other
LangChain-compatible LLM later with a one-line config change.

---

## 1. Project layout

```
AI Lawyer/
├── pak_laws.json               # original scraped corpus   (read-only)
├── pak_laws_rag.jsonl          # cleaned + chunked corpus  (input to RAG)
├── pak_laws_cleaned.json       # cleaned document-level    (reference)
├── pak_laws_rag_report.md      # build statistics
├── pak_laws_analysis.md        # earlier qualitative analysis
├── build_rag_corpus.py         # stage 1 - clean & chunk
├── rag_config.py               # stage 2 - central config (edit me!)
├── rag_ingest.py               # stage 2 - build FAISS index
├── rag_retriever.py            # stage 2 - reusable retriever class
├── rag_chatbot.py              # stage 2 - interactive demo chatbot
├── requirements.txt
├── .env.example                # copy to .env, fill in GOOGLE_API_KEY
└── faiss_index/                # <- output of rag_ingest.py, the vector DB
    ├── index.faiss             #     raw FAISS index
    └── index.pkl               #     LangChain docstore
```

The two files inside `faiss_index/` **are** your vector database. Copy the
folder anywhere and the chatbot will work.

---

## 2. One-time setup

### 2.1 Python environment

Tested on **Python 3.11 / 3.12 / 3.13 / 3.14** (Windows 10). Create a venv if
you don't already have one:

```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
```

### 2.2 Install dependencies

```powershell
pip install -r requirements.txt
```

This pulls in `torch` (CPU, ~120 MB), `sentence-transformers`, `faiss-cpu`,
`langchain-huggingface`, `langchain-community`, `langchain-google-genai` and
friends. First run takes a few minutes.

> If `torch` fails on Python 3.14, install the CPU-only wheel explicitly:
> ```powershell
> pip install torch --index-url https://download.pytorch.org/whl/cpu
> ```

### 2.3 Get a free Gemini API key

1. Visit https://aistudio.google.com/app/apikey
2. Click **Create API key** (requires a Google account; no credit card needed).
3. Copy `.env.example` -> `.env` and paste the key:

```dotenv
GOOGLE_API_KEY=AIzaSy...paste-your-key
```

Free-tier limits (April 2026):

| Model                  | Req / min | Req / day | Good for          |
|------------------------|-----------|-----------|-------------------|
| `gemini-2.5-flash-lite`| 15        | 1,000     | **default, heavy testing** |
| `gemini-2.5-flash`     | 10        |  ~500     | better answers   |
| `gemini-2.5-pro`       |  5        |   100     | best, tight quota |

Switch models via `.env`:

```dotenv
LLM_MODEL=gemini-2.5-flash
```

---

## 3. Build the vector database  (one-time, ~10-60 min on CPU)

```powershell
py rag_ingest.py
```

What happens:

1. Streams `pak_laws_rag.jsonl` (23,183 chunks) into LangChain `Document`s.
2. Loads `BAAI/bge-small-en-v1.5` (384-dim embedder, 33 M params, downloads
   once into `%USERPROFILE%\.cache\huggingface\hub\`).
3. Embeds every chunk in batches of 32 (progress bar shown).
4. Writes `faiss_index/index.faiss` and `faiss_index/index.pkl`.

Expected runtime on a modern laptop CPU: **~10 min**.
On a mid-range GPU (CUDA): **~30 s**.

Flags:

```powershell
py rag_ingest.py --force         # rebuild (overwrite existing index)
py rag_ingest.py --limit 500     # smoke-test on the first 500 chunks
```

Want a higher-quality model? Set in `.env`:

```dotenv
EMBEDDING_MODEL=BAAI/bge-base-en-v1.5      # 768-dim, ~2x slower, better recall
# or, for Urdu support:
EMBEDDING_MODEL=BAAI/bge-m3                # 1024-dim, multilingual
```

Remember to rerun `py rag_ingest.py --force` after changing the embedding
model — the query-time embedder **must** match the one used at ingestion.

---

## 4. Use the chatbot

### 4.1 Interactive REPL

```powershell
py rag_chatbot.py
```

```
Loading retriever ...
[LLM] using gemini
Virtual Lawyer (Pakistan).  Type your question, or:
  :category criminal     - filter by category
  :category              - clear the filter
  :context on|off        - show retrieved passages
  :k 8                   - change top-k
  :quit                  - exit

you> what is the punishment for theft under the Pakistan Penal Code?
...
you> :category family
[filter] category = 'family'
you> what is the minimum age for marriage in Pakistan?
...
you> :quit
```

### 4.2 One-shot mode

```powershell
py rag_chatbot.py "punishment for murder under PPC"
py rag_chatbot.py --category criminal "what counts as qatl-i-amd?"
py rag_chatbot.py --no-llm "dowry restriction act"          # retrieval only
py rag_chatbot.py --show-context "section 302"              # print passages
```

### 4.3 Available categories

`criminal  family  taxation  corporate  labour  property_land  law_enforcement
judicial  education  health  transport  commerce_trade  elections_gov
environment  civil_service  constitutional  general`

---

## 5. Using the retriever from your own code

This is the integration point for your chatbot / backend:

```python
from rag_retriever import PakLawsRetriever

retriever = PakLawsRetriever(top_k=5)

# 5.1 Plain retrieval
docs = retriever.retrieve("punishment for hurt by dangerous weapon")
for d in docs:
    m = d.metadata
    print(f"{m['act_title']} ({m['year']}) - {m['section_ref']}")
    print(d.page_content[:400])

# 5.2 Retrieval with similarity scores
for doc, score in retriever.retrieve_with_scores("bail in non-bailable offences"):
    print(score, doc.metadata['act_title'], doc.metadata['section_ref'])

# 5.3 Metadata filtering (server-side via FAISS post-filter)
docs = retriever.retrieve("khula procedure",
                          filter={"category": "family"})

# 5.4 Use as a LangChain retriever inside your own chain
lc_retriever = retriever.as_langchain_retriever()

# 5.5 Format retrieved chunks into a ready-made LLM context block
context = retriever.format_context(docs)
citations = retriever.format_citations(docs)
```

---

## 6. Swap the LLM when you are ready for production

The chatbot is backend-agnostic. Each backend is a tiny class in
`rag_chatbot.py` (`_GeminiBackend`, `_OpenAIBackend`, `_OllamaBackend`). To
switch:

```powershell
# 6.1 Gemini Pro 2.5 (still free tier, lower quota)
set LLM_MODEL=gemini-2.5-pro

# 6.2 OpenAI (paid)
pip install langchain-openai
set LLM_BACKEND=openai
set LLM_MODEL=gpt-4o
set OPENAI_API_KEY=sk-...

# 6.3 Local / offline via Ollama (free, private)
#     - install Ollama from https://ollama.com
#     - ollama pull llama3.1
pip install langchain-ollama
set LLM_BACKEND=ollama
set LLM_MODEL=llama3.1

# 6.4 Claude (paid)
pip install langchain-anthropic
set LLM_BACKEND=anthropic
set LLM_MODEL=claude-3-5-sonnet-latest
set ANTHROPIC_API_KEY=sk-ant-...
```

All cases: the retriever layer stays identical.

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `GOOGLE_API_KEY is not set` | Copy `.env.example` -> `.env`, add your key. |
| `FAISS index not found` | Run `py rag_ingest.py` first. |
| `torch` install fails | Use Python 3.11/3.12, or `pip install torch --index-url https://download.pytorch.org/whl/cpu`. |
| Ingestion is very slow | Normal on CPU. Switch to `bge-small` (default), add a GPU, or use a cloud embedding API. |
| Gemini 429 rate-limit | Switch to `gemini-2.5-flash-lite` (highest free quota). |
| Wrong-language answers | Default BGE is English-only; switch to `BAAI/bge-m3` and re-ingest. |

---

## 8. What the pipeline actually does

```
pak_laws.json
     |  build_rag_corpus.py
     v
pak_laws_rag.jsonl           (23,183 clean, section-aware chunks)
     |  rag_ingest.py
     |    - HuggingFaceEmbeddings (BAAI/bge-small-en-v1.5, 384-d, normalised)
     |    - FAISS.from_documents(docs, embeddings)
     v
faiss_index/                 (your vector DB)
     |  rag_retriever.py      (load + query, BGE query instruction applied)
     v
top-k similar chunks  --->  rag_chatbot.py
                               + Gemini (free tier, default)
                               + cited answer to the user
```

This file and the four `rag_*.py` scripts together implement the complete
ingestion -> storage -> retrieval -> generation loop described in
`pak_laws_analysis.md`.
