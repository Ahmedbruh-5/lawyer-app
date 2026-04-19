import { useTranslation } from 'react-i18next'
import { useSiteTheme } from '../../hooks/useSiteTheme'
import LawyerBotChat from '../../components/consultation/LawyerBotChat'
import { useNavigate } from 'react-router-dom'

function FreeConsultationPage() {
  const { t } = useTranslation()
  const { isDark } = useSiteTheme()
  const navigate = useNavigate()

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors ${
        isDark ? 'bg-[#212121]' : 'bg-[#f5f5f0]'
      }`}
    >
      {/* Top bar */}
      <header
        className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
          isDark
            ? 'border-white/10 bg-[#212121]'
            : 'border-black/10 bg-[#f5f5f0]'
        }`}
      >
        {/* Left — back button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors ${
            isDark
              ? 'text-[#8e8ea0] hover:text-white hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        {/* Center — title */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[#2563eb] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Lawyer Bot
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isDark
                ? 'bg-[#2563eb]/20 text-[#60a5fa]'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            Pakistani Law
          </span>
        </div>

        {/* Right — spacer to balance layout */}
        <div className="w-16" />
      </header>

      {/* Chat fills the rest */}
      <div className="flex-1 min-h-0">
        <LawyerBotChat
          onBack={() => navigate(-1)}
          className="h-full w-full flex flex-col"
          fullScreen
        />
      </div>
    </div>
  )
}

export default FreeConsultationPage