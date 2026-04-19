import axios from 'axios'
import { API_KEY } from '../constant'

/**
 * Default: Express proxy at `${API_KEY}/api/legal-chat/chat` → forwards to Python RAG (see backend).
 * Override with VITE_LEGAL_CHAT_API_URL for a custom URL (e.g. direct FastAPI during local tests).
 */
const CHAT_URL =
  import.meta.env.VITE_LEGAL_CHAT_API_URL?.trim() ||
  (import.meta.env.DEV
    ? '/api/legal-chat/chat'
    : `${String(API_KEY).replace(/\/$/, '')}/api/legal-chat/chat`)

export function isLegalChatConfigured() {
  return Boolean(CHAT_URL)
}

function extractReply(data) {
  if (data == null) return null
  if (typeof data === 'string') return data.trim() || null
  const candidates = [
    data.reply,
    data.response,
    data.answer,
    data.message,
    data.content,
    data.output,
    data.text,
    data.result,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
    const t = data.choices[0].message.content
    return typeof t === 'string' ? t.trim() : null
  }
  return null
}

/**
 * POST JSON body to Express:
 *   { messages: [{ role: "user"|"assistant", content: string }], session_id?: string }
 * Response: { reply, answer, ... } from Node proxy (Python returns answer; we surface reply).
 */
export async function sendLegalChat({ messages, sessionId }) {
  const payload = {
    messages: messages.map(({ role, content }) => ({
      role: role === 'assistant' ? 'assistant' : 'user',
      content: String(content ?? ''),
    })),
  }
  if (sessionId) payload.session_id = sessionId

  try {
    const { data } = await axios.post(CHAT_URL, payload, {
      timeout: 180_000,
      headers: { 'Content-Type': 'application/json' },
    })

    const reply = extractReply(data)
    if (!reply) {
      throw new Error(
        'Unexpected response from legal chat API. Ensure JSON includes reply, response, or answer.',
      )
    }
    return reply
  } catch (err) {
    const data = err.response?.data
    const detail = data?.detail
    let msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => (typeof d === 'object' ? d.msg || JSON.stringify(d) : d)).join('; ')
          : data?.message || err.message || 'Legal chat request failed'

    const low = String(msg).toLowerCase()
    const looksNetwork =
      low.includes('network') ||
      low.includes('timeout') ||
      low.includes('econnrefused') ||
      err.code === 'ECONNABORTED'
    if (!err.response && looksNetwork) {
      msg +=
        ' — Ensure Node backend is running and RAG_SERVICE_URL / RAG_API_KEY are set; the Python AI Lawyer service must be reachable from the backend.'
    }
    throw new Error(msg)
  }
}
