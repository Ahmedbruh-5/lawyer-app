import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { useSiteTheme } from '../../hooks/useSiteTheme'
import { sendLegalChat, isLegalChatConfigured } from '../../services/legalChatApi'
import { notifyError } from '../../utils/swal'

/** Assistant replies are Markdown (bold, lists); render them instead of raw ** / bullet characters. */
function AssistantMarkdown({ text, isDark }) {
  const muted = isDark ? 'text-[#94a3b8]' : 'text-slate-600'
  const body = isDark ? 'text-[#e2e8f0]' : 'text-slate-800'

  return (
    <div className={`legal-chat-md text-sm leading-relaxed ${body}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0 [&+p]:mt-3">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-inherit">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1.5 pl-5 marker:text-inherit">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1.5 pl-5 marker:text-inherit">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          h1: ({ children }) => (
            <h1 className={`mb-2 mt-1 text-base font-bold first:mt-0 ${body}`}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={`mb-2 mt-4 text-base font-bold first:mt-0 ${body}`}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={`mb-1.5 mt-3 text-sm font-semibold first:mt-0 ${body}`}>{children}</h3>
          ),
          hr: () => <hr className={`my-3 border-t ${isDark ? 'border-[#1e3a5f]' : 'border-slate-200'}`} />,
          blockquote: ({ children }) => (
            <blockquote
              className={`my-2 border-l-2 pl-3 italic ${isDark ? 'border-[#3b82f6]/50' : 'border-blue-400/70'} ${muted}`}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                isDark
                  ? 'font-medium text-sky-400 underline decoration-sky-400/60'
                  : 'font-medium text-blue-600 underline'
              }
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function bubbleBase(isDark, role) {
  if (role === 'user') {
    return isDark
      ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#2563eb] px-4 py-2.5 text-sm text-white'
      : 'ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#2563eb] px-4 py-2.5 text-sm text-white'
  }
  return isDark
    ? 'max-w-[85%] rounded-2xl rounded-bl-md border border-[#1e3a5f] bg-[#0b2038] px-4 py-2.5 text-sm text-[#e2e8f0]'
    : 'max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm'
}

/**
 * Inline layout chat (fills parent height — use with a tall flex/min-height wrapper).
 * @param {{ onBack?: () => void, className?: string }} props
 */
export default function LawyerBotChat({ onBack, className = '' }) {
  const { t } = useTranslation()
  const { isDark } = useSiteTheme()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const sessionIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  )
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!onBack) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!isLegalChatConfigured()) {
      notifyError(
        t('consultation.chat_not_configured_title'),
        t('consultation.chat_not_configured_body'),
      )
      return
    }

    const userMsg = { role: 'user', content: text }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)

    try {
      const reply = await sendLegalChat({
        messages: nextHistory,
        sessionId: sessionIdRef.current,
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err?.message || String(err)
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
      notifyError(t('consultation.chat_error_title'), msg)
    } finally {
      setLoading(false)
    }
  }

  const shellCls = isDark
    ? 'flex flex-col overflow-hidden rounded-2xl border border-[#1e3a5f] bg-[#071628] shadow-xl'
    : 'flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'

  return (
    <div className={`${shellCls} ${className}`}>
      <header
        className={
          isDark
            ? 'flex shrink-0 items-center justify-between gap-3 border-b border-[#1e3a5f] bg-[#0b2038] px-4 py-3 sm:px-5 sm:py-4'
            : 'flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4'
        }
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={
                isDark
                  ? 'shrink-0 rounded-lg p-2 text-[#9ab4ce] transition-colors hover:bg-[#1e3a5f] hover:text-white'
                  : 'shrink-0 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900'
              }
              aria-label={t('consultation.chat_back')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h2 className={`truncate text-base font-semibold sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('consultation.chat_title')}
            </h2>
            <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-[#9ab4ce]' : 'text-slate-500'}`}>
              {t('consultation.chat_subtitle')}
            </p>
          </div>
        </div>
      </header>

      {!isLegalChatConfigured() && (
        <div
          className={
            isDark
              ? 'border-b border-amber-900/50 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-200'
              : 'border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900'
          }
        >
          {t('consultation.chat_env_hint')}
        </div>
      )}

      <div
        className={
          isDark
            ? 'min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4'
            : 'min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4'
        }
      >
        {messages.length === 0 && !loading && (
          <p className={`text-center text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>
            {t('consultation.chat_empty')}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={`${i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={bubbleBase(isDark, m.role)}>
              {m.role === 'user' ? (
                <span className="block whitespace-pre-wrap wrap-break-word">{m.content}</span>
              ) : (
                <AssistantMarkdown text={m.content} isDark={isDark} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className={
                isDark
                  ? 'rounded-2xl rounded-bl-md border border-[#1e3a5f] bg-[#0b2038] px-4 py-3 text-sm text-[#9ab4ce]'
                  : 'rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm'
              }
            >
              {t('consultation.chat_thinking')}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <p
        className={`shrink-0 px-4 pb-2 text-[10px] leading-snug ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}
      >
        {t('consultation.chat_disclaimer')}
      </p>

      <div
        className={
          isDark
            ? 'flex shrink-0 gap-2 border-t border-[#1e3a5f] bg-[#0b2038] p-4'
            : 'flex shrink-0 gap-2 border-t border-slate-200 bg-white p-4'
        }
      >
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={t('consultation.chat_placeholder')}
          disabled={loading}
          className={
            isDark
              ? 'min-h-[44px] flex-1 resize-none rounded-xl border border-[#1e3a5f] bg-[#071628] px-3 py-2 text-sm text-white outline-none placeholder:text-[#64748b] focus:border-[#3b82f6]'
              : 'min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500'
          }
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="shrink-0 self-end rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('consultation.chat_send')}
        </button>
      </div>
    </div>
  )
}
