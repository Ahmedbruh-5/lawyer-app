import FeaturePageLayout from './FeaturePageLayout'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getStatutes, getStatuteById, getStatuteFiltersMeta } from '../../services/statuteAPIs'
import { useDebounce } from '../../hooks/useDebounce'
import { useSiteTheme } from '../../hooks/useSiteTheme'

function StatuteSearchPage() {
  const { t } = useTranslation()
  const { isDark } = useSiteTheme()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 320)
  const [type, setType] = useState('')
  const [year, setYear] = useState('')

  const [statutes, setStatutes] = useState([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')

  const [typesMeta, setTypesMeta] = useState([])
  const [yearsMeta, setYearsMeta] = useState([])
  const [selectedStatute, setSelectedStatute] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const inputCls = isDark
    ? 'w-full rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-4 py-3 text-sm text-white outline-none focus:border-blue-500'
    : 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500'

  const cardCls = isDark
    ? 'cursor-pointer rounded-2xl border border-[#1e3a5f] bg-[#0b2038] p-5 transition-colors hover:border-[#3b82f6]'
    : 'cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-400'

  const badgeCls = isDark
    ? 'rounded-full border border-[#1e3a5f] bg-[#122d4c] px-3 py-1 text-xs text-[#9ab4ce]'
    : 'rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600'

  const metaMuted = isDark ? 'text-[#9ab4ce]' : 'text-slate-600'

  const fetchMeta = useCallback(async () => {
    const data = await getStatuteFiltersMeta()
    setTypesMeta(data.types || [])
    setYearsMeta(data.years || [])
  }, [])

  useEffect(() => {
    fetchMeta().catch(() => {})
  }, [fetchMeta])

  useEffect(() => {
    const ac = new AbortController()
    let active = true

    const run = async () => {
      try {
        setIsFetching(true)
        setError('')
        const data = await getStatutes({
          search: debouncedSearch,
          type,
          year,
          page: 1,
          limit: 20,
          includeText: true,
          signal: ac.signal,
        })
        if (!active) return
        setStatutes(data.statutes || [])
      } catch (e) {
        if (!active || e?.code === 'ERR_CANCELED') return
        setError(e.message || 'Failed to load statutes')
      } finally {
        if (active) setIsFetching(false)
      }
    }

    run()
    return () => {
      active = false
      ac.abort()
    }
  }, [debouncedSearch, type, year])

  const openStatuteDetail = async (id) => {
    try {
      setDetailLoading(true)
      const data = await getStatuteById(id)
      setSelectedStatute(data)
    } catch (e) {
      setError(e.message || 'Failed to load statute details')
    } finally {
      setDetailLoading(false)
    }
  }

  const modalShellCls = isDark
    ? 'w-full max-w-4xl rounded-2xl border border-[#1e3a5f] bg-[#071628] p-5 shadow-2xl'
    : 'w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl'

  const modalBodyCls = isDark
    ? 'max-h-[65vh] overflow-auto rounded-xl border border-[#1e3a5f] bg-[#0b2038] p-4'
    : 'max-h-[65vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4'

  return (
    <FeaturePageLayout
      title={t('features.statutes.title')}
      subtitle={t('features.statutes.subtitle')}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or content..."
          className={inputCls}
        />

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={inputCls}
        >
          <option value="">All Types</option>
          {typesMeta.map((typeName) => (
            <option key={typeName} value={typeName} className="text-black">
              {typeName}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(event) => setYear(event.target.value)}
          className={inputCls}
        >
          <option value="">All Years</option>
          {yearsMeta.map((y) => (
            <option key={y} value={y} className="text-black">
              {y}
            </option>
          ))}
        </select>
      </div>

      {isFetching && !statutes.length && !error && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-8" role="status" aria-live="polite">
          <div
            className={`h-12 w-12 shrink-0 animate-spin rounded-full border-2 border-t-transparent ${
              isDark ? 'border-[#1e3a5f] border-t-[#60a5fa]' : 'border-slate-200 border-t-blue-600'
            }`}
          />
          <p className={`text-sm ${metaMuted}`}>Loading statutes…</p>
        </div>
      )}
      {isFetching && statutes.length > 0 && (
        <div className={`mb-3 flex items-center gap-2 text-xs ${metaMuted}`} role="status" aria-live="polite">
          <div
            className={`h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-t-transparent ${
              isDark ? 'border-[#1e3a5f] border-t-[#60a5fa]' : 'border-slate-200 border-t-blue-600'
            }`}
          />
          <span>Updating results…</span>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && (
        <div
          className={`space-y-3 transition-opacity duration-200 ${
            isFetching && statutes.length > 0 ? 'opacity-75' : 'opacity-100'
          }`}
        >
          {statutes.map((s) => {
            const preview = s.text ? s.text.replace(/\s+/g, ' ').trim().slice(0, 220) : ''
            return (
              <article
                key={s._id}
                onClick={() => openStatuteDetail(s._id)}
                className={cardCls}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {s.title}
                  </h2>
                  <span className={badgeCls}>
                    {s.type || 'Other'}
                    {s.year ? ` • ${s.year}` : ''}
                  </span>
                </div>

                {preview ? (
                  <p className={`mt-3 line-clamp-5 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {preview}{s.text && s.text.length > 220 ? '...' : ''}
                  </p>
                ) : (
                  <p className={`mt-3 text-sm ${isDark ? 'text-[#94aec4]' : 'text-slate-500'}`}>No text available for this statute.</p>
                )}
              </article>
            )
          })}

          {!isFetching && !statutes.length && (
            <p className={`text-sm ${metaMuted}`}>No statutes matched your search.</p>
          )}
        </div>
      )}

      {selectedStatute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedStatute(null)}>
          <div
            className={modalShellCls}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#2563eb]">
                  {selectedStatute.type || 'Other'}
                  {selectedStatute.year ? ` • ${selectedStatute.year}` : ''}
                </p>
                <h2 className={`mt-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedStatute.title}</h2>
              </div>
              <button
                onClick={() => setSelectedStatute(null)}
                className={
                  isDark
                    ? 'rounded-lg border border-[#1e3a5f] px-2 py-1 text-xs text-[#9ab4ce] hover:text-white'
                    : 'rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50'
                }
              >
                Close
              </button>
            </div>

            <div className={modalBodyCls}>
              <p className={`whitespace-pre-wrap text-sm leading-7 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {selectedStatute.text || 'No full text available.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className={`mt-4 flex items-center justify-center gap-3 py-6 ${metaMuted}`} role="status" aria-live="polite">
          <div
            className={`h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-t-transparent ${
              isDark ? 'border-[#1e3a5f] border-t-[#60a5fa]' : 'border-slate-200 border-t-blue-600'
            }`}
          />
          <span className="text-sm">Loading full statute…</span>
        </div>
      )}
    </FeaturePageLayout>
  )
}

export default StatuteSearchPage
