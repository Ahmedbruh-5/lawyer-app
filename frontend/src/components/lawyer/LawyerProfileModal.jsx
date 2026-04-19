import { useTranslation } from 'react-i18next'

function getLawyerInitials(name) {
  if (!name || typeof name !== 'string') return '?'
  const parts = name.split(/[\s,]+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0]
    const b = parts[1][0]
    return `${a}${b}`.toUpperCase()
  }
  const single = parts[0]
  return (single.length >= 2 ? single.slice(0, 2) : single[0]).toUpperCase()
}

/**
 * Full lawyer detail overlay — shared by Home (featured counsel) and Hire a Lawyer listing.
 */
export default function LawyerProfileModal({ lawyer, onClose, isDark }) {
  const { t } = useTranslation()

  if (!lawyer) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lawyer-profile-title"
        className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl ${
          isDark ? 'border-[#1e3a5f] bg-[#0b2038] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={`absolute right-4 top-4 rounded-lg px-2 py-1 text-2xl leading-none transition hover:bg-white/10 ${
            isDark ? 'text-[#9ab4ce]' : 'text-slate-500 hover:bg-slate-100'
          }`}
          aria-label={t('home.close_profile', 'Close')}
          onClick={onClose}
        >
          ×
        </button>
        <div className="flex flex-col items-center gap-4 border-b border-[#1e3a5f]/40 pb-6 pt-2">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#274a73] to-[#1b3250] text-3xl font-bold text-white">
            {getLawyerInitials(lawyer.name)}
          </div>
          <div className="text-center">
            <h3 id="lawyer-profile-title" className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {lawyer.name}
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>{lawyer.specialty}</p>
            {(lawyer.location || lawyer.rate) && (
              <p className={`mt-2 text-xs ${isDark ? 'text-[#7c9cbc]' : 'text-slate-500'}`}>
                {[lawyer.location, lawyer.rate].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <dl className={`mt-6 space-y-4 text-sm ${isDark ? 'text-[#c4d8ed]' : 'text-slate-700'}`}>
          {lawyer.bio ? (
            <div>
              <dt
                className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-[#7c9cbc]' : 'text-slate-500'}`}
              >
                {t('home.profile_bio', 'Bio')}
              </dt>
              <dd className="leading-relaxed">{lawyer.bio}</dd>
            </div>
          ) : (
            <p className={`text-sm italic ${isDark ? 'text-[#7c9cbc]' : 'text-slate-500'}`}>
              {t('home.no_bio', 'Bio coming soon.')}
            </p>
          )}
          {lawyer.phone && (
            <div>
              <dt
                className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-[#7c9cbc]' : 'text-slate-500'}`}
              >
                {t('home.profile_phone', 'Phone')}
              </dt>
              <dd>
                <a href={`tel:${lawyer.phone.replace(/\s+/g, '')}`} className="text-[#60a5fa] hover:underline">
                  {lawyer.phone}
                </a>
              </dd>
            </div>
          )}
          {lawyer.email && (
            <div>
              <dt
                className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-[#7c9cbc]' : 'text-slate-500'}`}
              >
                {t('home.profile_email', 'Email')}
              </dt>
              <dd>
                <a href={`mailto:${lawyer.email}`} className="break-all text-[#60a5fa] hover:underline">
                  {lawyer.email}
                </a>
              </dd>
            </div>
          )}
          {lawyer.verified !== undefined && (
            <div>
              <dt
                className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-[#7c9cbc]' : 'text-slate-500'}`}
              >
                {t('home.profile_verified', 'Verified')}
              </dt>
              <dd>{lawyer.verified ? t('home.profile_yes', 'Yes') : t('home.profile_no', 'No')}</dd>
            </div>
          )}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          {lawyer.email && (
            <a
              href={`mailto:${lawyer.email}`}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                isDark ? 'border-[#1e3a5f] bg-[#0f2a48] text-[#c4d8ed]' : 'border-slate-300 bg-slate-100 text-slate-800'
              }`}
            >
              {t('home.email_counsel', 'Email')}
            </a>
          )}
          {lawyer.phone && (
            <a
              href={`tel:${lawyer.phone.replace(/\s+/g, '')}`}
              className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]"
            >
              {t('home.schedule_call')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
