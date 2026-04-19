# MERN developer handoff — AI Lawyer RAG service

Give this document to the MERN developer. The **Python RAG service** is separate from Node/React. The MERN app should call it **only from the Express backend** (never from the browser).

---

## 1. What they are integrating

| Item | Role |
|------|------|
| **Express** | Public API for your app. Validates the user (e.g. better-auth), stores chat in MongoDB, calls Python with server-side secrets. |
| **Python FastAPI** | Internal service: FAISS retrieval + Gemini. Holds `GOOGLE_API_KEY` and the FAISS index. |
| **React** | Calls **your** Express routes only. No `RAG_API_KEY`, no `GOOGLE_API_KEY`, no direct calls to port 8000. |

---

## 2. Service URL (dev vs prod)

| Environment | `RAG_SERVICE_URL` example |
|---------------|-------------------------|
| Local (same machine as Express) | `http://127.0.0.1:8000` |
| Docker / same host | `http://rag-service:8000` (compose service name) |
| Remote VPS | `http://10.x.x.x:8000` on **private** network only |

**Do not** expose the Python service directly on the public internet. Put it behind Express or a private VPC.

### 2.1 LAN example (what your MERN dev asked for)

They want the chat endpoint at a URL like:

`http://192.168.1.50:8000/chat`

That is **correct** for the **path** (`/chat`) and **port** (`8000`). Two details matter:

| Topic | Detail |
|--------|--------|
| **HTTP method** | Chat is **`POST /chat`**, not `GET`. A browser address bar only does `GET`, so opening that URL in Chrome will **not** run chat — use Express `fetch`, Postman, or `/docs` in Swagger. |
| **Host** | `192.168.1.50` must be the PC where Python runs, and Uvicorn must listen on **all interfaces**: `--host 0.0.0.0` (not only `127.0.0.1`), or other machines cannot reach it. |

**Express `.env` when the RAG PC is `192.168.1.50`:**

```env
RAG_SERVICE_URL=http://192.168.1.50:8000
RAG_API_KEY=<same as Python .env>
```

**Full chat URL the backend should call:**

```http
POST http://192.168.1.50:8000/chat
Content-Type: application/json
X-API-Key: <RAG_API_KEY>

{ "question": "…", "top_k": 5, "category": null, "history": [] }
```

**Start Python so LAN can reach it** (on the machine `192.168.1.50`):

```powershell
cd "d:\AI Lawyer"
py -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Firewall: allow **inbound TCP 8000** on that Windows PC if Express runs on another device.

---

## 3. Environment variables (Express / Node `.env`)

```env
# Required — must match the value in the Python project’s .env (RAG_API_KEY)
RAG_API_KEY=<same value as Python side>

# Base URL of the Python API (no trailing slash)
RAG_SERVICE_URL=http://127.0.0.1:8000
```

The Python side **also** needs `GOOGLE_API_KEY` (Gemini) in **its** `.env` — that stays on the Python server only, not in MERN.

---

## 4. HTTP API contract

**Base URL:** `{RAG_SERVICE_URL}`  
**Content-Type:** `application/json`  
**Auth:** every endpoint below except `/health` and `/` requires:

```http
X-API-Key: <RAG_API_KEY>
```

### `GET /health` — no API key

Use for readiness checks (Express or load balancer).

**200** example:

```json
{
  "status": "ok",
  "embedding_model": "BAAI/bge-small-en-v1.5",
  "llm_backend": "gemini",
  "llm_model": "gemini-2.5-flash-lite"
}
```

### `POST /retrieve` — retrieval only (no LLM, fast)

**Body:**

```json
{
  "query": "punishment for theft under Pakistan Penal Code",
  "top_k": 5,
  "category": null
}
```

- `category`: optional string filter, e.g. `"criminal"`, `"family"`, `"taxation"`, or `null` for all.

**200** shape:

```json
{
  "query": "...",
  "count": 5,
  "passages": [
    {
      "rank": 1,
      "score": 0.77,
      "act_title": "THE PAKISTAN PENAL CODE",
      "year": null,
      "section_ref": "Chapter VI / Section 123",
      "category": "criminal",
      "content": "..."
    }
  ]
}
```

### `POST /chat` — retrieval + LLM answer (main chat)

**Body:**

```json
{
  "question": "What is the punishment for theft under the PPC?",
  "top_k": 5,
  "category": null,
  "history": [
    { "role": "user", "content": "Earlier question text" },
    { "role": "assistant", "content": "Earlier answer summary" }
  ]
}
```

- `history`: optional; last ~6 turns recommended. Roles: `"user"` | `"assistant"`.
- `category`: same as `/retrieve`.

**200** shape:

```json
{
  "question": "...",
  "answer": "Synthesised answer text…",
  "citations": ["string", "…"],
  "passages": [ { "rank", "act_title", "year", "section_ref", "category", "content" } ],
  "used_llm": true,
  "latency_ms": 3500
}
```

**Errors:**

| Status | Meaning |
|--------|---------|
| `401` | Missing or wrong `X-API-Key` |
| `503` | Python server missing `RAG_API_KEY` in its env |
| `422` | Validation error (body fields) |

---

## 5. Example: Express `fetch` (server-side only)

```javascript
const url = `${process.env.RAG_SERVICE_URL}/chat`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.RAG_API_KEY,
  },
  body: JSON.stringify({
    question: userQuestion,
    top_k: 5,
    category: categoryOrNull,
    history: priorTurnsArray,
  }),
});
if (!res.ok) throw new Error(`RAG /chat ${res.status}`);
const data = await res.json();
// data.answer, data.citations, data.passages, data.used_llm, data.latency_ms
```

Use a **timeout** (e.g. 60s) — first call after cold start can be slow while models load.

---

## 6. Interactive docs (for manual QA only)

When the Python service is running:

- **Swagger:** `{RAG_SERVICE_URL}/docs`
- **ReDoc:** `{RAG_SERVICE_URL}/redoc`
- **Root:** `GET /` redirects to `/docs`

Use these for QA, not for production end users.

---

## 7. What the Python team / DevOps must run

On the machine that hosts the RAG API:

```powershell
cd "<path-to-AI-Lawyer-project>"
# LAN / another PC on Wi‑Fi (MERN dev laptop → your PC at 192.168.1.50):
py -m uvicorn api_server:app --host 0.0.0.0 --port 8000
# Same machine only:
# py -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

Requirements: Python env with `requirements.txt` installed; `faiss_index/` and `pak_laws_rag.jsonl` present; `.env` with at least `GOOGLE_API_KEY`, `RAG_API_KEY`.

**Port in use (Windows 10048):** only one process per port; stop the old Uvicorn or use another port and update `RAG_SERVICE_URL`.

### 7.1 `net::ERR_CONNECTION_TIMED_OUT` (browser or fetch)

That error means **TCP never connected** — the request did not reach FastAPI. **Changing CORS does not fix a timeout.**

Checklist on the **FastAPI PC** (`192.168.1.50` or whatever IP you use):

1. **Uvicorn is running** and bound to all interfaces: `--host 0.0.0.0` (not `127.0.0.1` alone).
2. **Windows Firewall** allows inbound **TCP 8000**. From an **elevated** PowerShell:

   ```powershell
   New-NetFirewallRule -DisplayName "AI Lawyer RAG 8000" -Direction Inbound `
     -LocalPort 8000 -Protocol TCP -Action Allow
   ```

3. **Correct IP** — on the FastAPI machine run `ipconfig` and use that adapter’s **IPv4** (Wi‑Fi vs Ethernet can differ from `192.168.1.50`).
4. From the **MERN laptop**, test: `ping 192.168.1.50` then in browser open `http://192.168.1.50:8000/health` — you should see JSON. If that times out, fix network/firewall before debugging `/chat`.

### 7.2 CORS (only after connection works)

If the browser shows **CORS** errors (not timeout), the FastAPI app allows:

- Default origins: `http://localhost:5173`, `http://127.0.0.1:5173`, and ports `3000`.
- Plus a **regex** for LAN dev: `http://192.168.x.x:anyPort` (e.g. Vite on another PC).

Override in Python `.env` if needed:

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://10.0.0.5:5173
# To disable the 192.168.* regex:
# CORS_DISABLE_LAN_REGEX=1
```

**Recommended architecture:** React → **your Express API** → FastAPI. Then the browser never talks to port 8000 directly (no CORS to FastAPI, no API key in the frontend). Direct `fetch` from React to `192.168.1.50:8000` is only for quick hacks.

---

## 8. React developer checklist

- [ ] Chat UI calls **Express** only (e.g. `POST /api/.../chat`).
- [ ] Never embed `RAG_API_KEY` or `GOOGLE_API_KEY` in frontend env (`NEXT_PUBLIC_*` etc.).
- [ ] Show `answer` to the user; show `citations` / `passages` in a “Sources” panel if product needs it.
- [ ] Handle Express errors (429, 502, timeout) with user-friendly messages.

---

## 9. Single file to attach

Attach **this file** (`MERN_DEVELOPER_HANDOFF.md`) plus:

- The agreed **`RAG_SERVICE_URL`** for their environment, and  
- **`RAG_API_KEY`** via a **secure channel** (1Password, env in deployment dashboard) — **not** in Slack/email if possible.
