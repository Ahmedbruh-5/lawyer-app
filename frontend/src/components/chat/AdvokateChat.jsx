import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are Advokate Desk AI, a professional legal assistant integrated into the Advokate Desk platform. You specialize in Pakistani law, including federal and provincial statutes applicable in Pakistan. Do not reference laws from other countries unless asked for comparison.

Your role is to help users understand legal concepts, statutes, and procedures in simple and clear language. You also guide users on how to connect with lawyers available on the platform.

You are NOT a licensed lawyer and must not provide definitive legal advice or make decisions for users. Always clarify that your responses are for informational purposes only when necessary.

Your behavior:
- Explain legal terms in simple, easy-to-understand language
- Be clear, concise, and practical (avoid long unnecessary explanations)
- Stay neutral and do not take sides in disputes
- Encourage users to consult a qualified lawyer for serious or case-specific issues
- If a question is unclear, ask for clarification instead of guessing
- If the user writes in Urdu or Roman Urdu, respond in the same language. Default to English if unclear.

When answering:
- Prefer structured answers when helpful
- Use examples when explaining laws
- If relevant, suggest next steps (e.g., consult a lawyer, check a section, gather documents)
- When referencing a law, mention the specific section number (e.g., Section 302 PPC)

You can assist with:
- Legal sections and statutes (Pakistan Penal Code, CrPC, CPC, etc.)
- General legal knowledge (criminal, civil, contracts, rights)
- Platform usage (finding lawyers, chatting, searching laws)

You must refuse:
- Giving final legal judgments
- Acting as a replacement for a lawyer
- Answering unrelated topics outside legal and platform scope

Maintain a professional and business-appropriate tone. Use a warm, approachable and friendly tone.`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/** Override in `.env` if `gemini-2.0-flash` quota is exhausted, e.g. `gemini-2.5-flash` or `gemini-2.5-flash-lite` */
const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";

const getGeminiUrl = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const MAX_GEMINI_RETRIES = 4;

function parseRetryDelayMs(error) {
  const msg = error?.message || "";
  const fromMsg = msg.match(/retry in ([\d.]+)\s*s/i);
  if (fromMsg) {
    const sec = parseFloat(fromMsg[1]);
    if (!Number.isNaN(sec)) return Math.ceil(sec * 1000) + 400;
  }
  const details = error?.details;
  if (Array.isArray(details)) {
    for (const d of details) {
      const rd = d?.retryDelay;
      if (typeof rd === "string" && /^\d/.test(rd)) {
        const sec = parseFloat(rd.replace(/s$/i, ""));
        if (!Number.isNaN(sec)) return Math.ceil(sec * 1000) + 400;
      }
    }
  }
  return 15_000;
}

function friendlyQuotaMessage(error) {
  const raw = error?.message || "";
  return (
    "The AI service is temporarily over its usage limit (quota).\n\n" +
    "What you can do:\n" +
    "• Wait a minute and try again — limits reset on a rolling window.\n" +
    "• In Google AI Studio, check billing and quotas for this API key.\n" +
    "• Optionally set `VITE_GEMINI_MODEL` in `.env` to another model (e.g. gemini-2.5-flash-lite) if that model still has quota.\n\n" +
    (raw ? `Details: ${raw}` : "")
  );
}

// ✅ Fix: Gemini File API only accepts files uploaded via File API, NOT public URLs.
// These are your Gemini File API URIs after running uploadPdfs.js
// Format: "https://generativelanguage.googleapis.com/v1beta/files/XXXX"
const PDF_FILE_URIS = [
  "https://generativelanguage.googleapis.com/v1beta/files/zh9roetxaxkh",
  "https://generativelanguage.googleapis.com/v1beta/files/ynm3o834fs0x",
"https://generativelanguage.googleapis.com/v1beta/files/kbfl89zg84og",
"https://generativelanguage.googleapis.com/v1beta/files/8gzhpl0dewar",
  "https://generativelanguage.googleapis.com/v1beta/files/vrnzkxfayexl",
  "https://generativelanguage.googleapis.com/v1beta/files/gvmq22g5kxls",
  "https://generativelanguage.googleapis.com/v1beta/files/32sr3ugi3p0c",
  "https://generativelanguage.googleapis.com/v1beta/files/9r8b45z9rad6",
];

const suggestedQuestions = [
  "What is Section 302 PPC?",
  "How do I file a civil suit?",
  "What are my rights if arrested?",
  "Explain bail procedure in Pakistan",
];

const fileParts = PDF_FILE_URIS
  .filter((u) => u.startsWith("https://generativelanguage.googleapis.com/v1beta/files/"))
  .map((uri) => ({ fileData: { mimeType: "application/pdf", fileUri: uri } }));

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "12px", gap: "8px", alignItems: "flex-end" }}>
      {!isUser && (
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #1a3a5c, #2e6da4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", color: "#fff", fontWeight: "600" }}>
          AD
        </div>
      )}
      <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg, #1a3a5c, #2e6da4)" : "#f0f4f8", color: isUser ? "#fff" : "#1a2a3a", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function AdvokateChat() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Assalamu Alaikum! I'm Advokate Desk AI, your legal assistant for Pakistani law. How can I help you today?\n\nYou can ask me about legal sections, rights, procedures, or how to find a lawyer on our platform." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const contents = newMessages.map((m, idx) => {
        const isUserMsg = m.role === "user";
        const isFirstUser = isUserMsg && idx === 1 && fileParts.length > 0;
        return {
          role: isUserMsg ? "user" : "model",
          parts: isFirstUser ? [...fileParts, { text: m.content }] : [{ text: m.content }],
        };
      });

      const body = JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      });

      let data;
      let attempt = 0;
      for (;;) {
        const res = await fetch(getGeminiUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        data = await res.json();

        const err = data?.error;
        const is429 =
          res.status === 429 ||
          err?.code === 429 ||
          err?.status === "RESOURCE_EXHAUSTED";

        if (!err || !is429 || attempt >= MAX_GEMINI_RETRIES - 1) {
          if (err && is429) {
            console.warn("Gemini API error (after retries):", err);
          }
          break;
        }

        const waitMs = parseRetryDelayMs(err);
        console.warn(
          `Gemini rate limited (${GEMINI_MODEL}), retry ${attempt + 1}/${MAX_GEMINI_RETRIES - 1} in ${waitMs}ms`
        );
        await new Promise((r) => setTimeout(r, waitMs));
        attempt++;
      }

      if (data.error) {
        console.error("Gemini API error:", data.error);
        const content =
          data.error.code === 429 || data.error.status === "RESOURCE_EXHAUSTED"
            ? friendlyQuotaMessage(data.error)
            : `API Error: ${data.error.message}`;
        setMessages([...newMessages, { role: "assistant", content }]);
        return;
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't process your request. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Network error:", err);
      setMessages([...newMessages, { role: "assistant", content: "Network error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <>
      {isOpen && (
        <div style={{ position: "fixed", bottom: "90px", right: "24px", width: "380px", height: "580px", borderRadius: "20px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 9999, fontFamily: "'Segoe UI', system-ui, sans-serif", border: "1px solid rgba(0,0,0,0.08)" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2e6da4 100%)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "#fff", fontWeight: "700", flexShrink: 0 }}>AD</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: "600", fontSize: "15px" }}>Advokate Desk AI</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                {fileParts.length > 0 ? `Pakistani Legal Assistant · ${fileParts.length} PDFs Loaded` : "Pakistani Legal Assistant"}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#fff" }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {messages.length === 1 && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "12px", color: "#8a9bb0", marginBottom: "8px" }}>Try asking:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {suggestedQuestions.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)} style={{ background: "#f0f7ff", border: "1px solid #c8dff5", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1a3a5c", cursor: "pointer", textAlign: "left" }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", gap: "4px", padding: "10px 14px", background: "#f0f4f8", borderRadius: "18px 18px 18px 4px", width: "fit-content", marginTop: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2e6da4", display: "inline-block", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #e8eef5", display: "flex", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a legal question..." rows={1}
              style={{ flex: 1, border: "1px solid #d0dce8", borderRadius: "12px", padding: "10px 14px", fontSize: "14px", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: "1.5", maxHeight: "100px", overflowY: "auto", color: "#1a2a3a" }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: "40px", height: "40px", borderRadius: "12px", background: !input.trim() || loading ? "#c8dff5" : "linear-gradient(135deg, #1a3a5c, #2e6da4)", border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <style>{`@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }`}</style>
        </div>
      )}

      {/* Floating Button */}
      <button onClick={() => setIsOpen((o) => !o)}
        style={{ position: "fixed", bottom: "24px", right: "24px", width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #1a3a5c, #2e6da4)", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(30,90,160,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, transition: "transform 0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
        {isOpen
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
          : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        }
      </button>
    </>
  );
}