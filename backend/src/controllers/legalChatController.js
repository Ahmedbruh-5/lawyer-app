const axios = require('axios');

/**
 * Maps UI message list to FastAPI ChatRequest shape (see backend/src/AI Lawyer/api_server.py).
 * Last user message becomes `question`; everything before it is `history`.
 */
function toRagPayload(messages) {
  const normalized = (messages || [])
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').trim(),
    }))
    .filter((m) => m.content.length > 0);

  let lastUserIndex = -1;
  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    if (normalized[i].role === 'user') {
      lastUserIndex = i;
      break;
    }
  }

  if (lastUserIndex === -1) {
    const err = new Error('No user message in chat payload');
    err.status = 400;
    throw err;
  }

  const question = normalized[lastUserIndex].content;
  if (question.length < 3) {
    const err = new Error('Question must be at least 3 characters');
    err.status = 400;
    throw err;
  }

  const history = normalized.slice(0, lastUserIndex).map((t) => ({
    role: t.role,
    content: t.content,
  }));

  return { question, history };
}

async function proxyChat(req, res) {
  try {
    const ragBase = process.env.RAG_SERVICE_URL?.trim();
    const ragKey = process.env.RAG_API_KEY?.trim();

    if (!ragBase || !ragKey) {
      return res.status(503).json({
        message:
          'RAG service is not configured. Set RAG_SERVICE_URL and RAG_API_KEY in backend .env (same key as Python RAG_API_KEY).',
      });
    }

    const { messages, session_id: sessionId } = req.body;
    const { question, history } = toRagPayload(messages);

    const url = `${ragBase.replace(/\/$/, '')}/chat`;
    const topK = Math.min(
      15,
      Math.max(1, parseInt(process.env.RAG_TOP_K || '5', 10) || 5),
    );

    const { data } = await axios.post(
      url,
      {
        question,
        history,
        top_k: topK,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ragKey,
        },
        timeout: 180000,
      },
    );

    return res.json({
      reply: data.answer,
      answer: data.answer,
      citations: data.citations,
      passages: data.passages,
      used_llm: data.used_llm,
      latency_ms: data.latency_ms,
      session_id: sessionId || undefined,
    });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ message: err.message });
    }

    const code = err.code;
    const isUnreachable =
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET' ||
      err.message?.includes('ECONNREFUSED');

    if (isUnreachable) {
      const ragBase = process.env.RAG_SERVICE_URL?.trim() || 'your RAG URL';
      console.error('[legal-chat] RAG unreachable:', code || err.message, '→', ragBase);
      return res.status(503).json({
        message:
          `Cannot reach the AI Lawyer service at ${ragBase}. Start it (e.g. uvicorn in backend/src/AI Lawyer) and ensure the port matches RAG_SERVICE_URL.`,
      });
    }

    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail;
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => (d.msg ? d.msg : JSON.stringify(d))).join('; ')
          : err.response?.data?.message || err.message || 'Legal chat proxy failed';

    console.error('[legal-chat]', status, msg);
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      message: msg,
    });
  }
}

module.exports = { proxyChat, toRagPayload };
