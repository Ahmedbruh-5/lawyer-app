import FeaturePageLayout from './FeaturePageLayout'
import { useEffect, useState } from 'react'
import { getLawyers } from '../../services/lawyerAPIs'
import { useSiteTheme } from '../../hooks/useSiteTheme'

function HireLawyerPage() {
  const { isDark } = useSiteTheme()
  const [lawyers, setLawyers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const inputCls = isDark
    ? 'w-full rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-4 py-3 text-sm text-white outline-none placeholder:text-[#5a7fa0] focus:border-blue-500'
    : 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500'

  const cardCls = isDark
    ? 'rounded-2xl border border-[#1e3a5f] bg-[#0b2038] p-5'
    : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

  const fetchLawyers = async (q = '') => {
    try {
      setIsLoading(true)
      setError('')
      const data = await getLawyers({ q })
      setLawyers(data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lawyers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLawyers(search)
  }, [search])

  return (
    <FeaturePageLayout
      title="Hire a Lawyer"
      subtitle="Browse verified legal professionals from database."
    >

      <div className="mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, specialty, location, phone, or email..."
          className={inputCls}
        />
      </div>

      {isLoading && (
        <p className={`mb-3 text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>Loading lawyers...</p>
      )}
      {!!error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lawyers.map((lawyer) => (
          <article key={lawyer._id || lawyer.name} className={cardCls}>
            <div className={`mb-4 h-12 w-12 rounded-full ${isDark ? 'bg-[#1d4ed8]/40' : 'bg-blue-100'}`} />
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{lawyer.name}</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>{lawyer.specialty}</p>
            {lawyer.bio && (
              <p className={`mt-2 line-clamp-3 text-xs ${isDark ? 'text-[#c4d8ed]' : 'text-slate-600'}`}>{lawyer.bio}</p>
            )}
            {(lawyer.phone || lawyer.email) && (
              <div className={`mt-3 space-y-1 text-xs ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>
                {lawyer.phone && <p>{lawyer.phone}</p>}
                {lawyer.email && (
                  <a href={`mailto:${lawyer.email}`} className="block truncate text-[#2563eb] hover:underline">
                    {lawyer.email}
                  </a>
                )}
              </div>
            )}
            <div className={`mt-4 flex items-center justify-between text-xs ${isDark ? 'text-[#c4d8ed]' : 'text-slate-600'}`}>
              <span>{lawyer.location}</span>
              <span>{lawyer.rate}</span>
            </div>
            <button className="mt-4 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]">
              View Profile
            </button>
          </article>
        ))}
      </div>

      {!isLoading && !lawyers.length && !error && (
        <p className={`mt-4 text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>No lawyers found.</p>
      )}
    </FeaturePageLayout>
  )
}

export default HireLawyerPage
