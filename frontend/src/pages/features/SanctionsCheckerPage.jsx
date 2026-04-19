import FeaturePageLayout from './FeaturePageLayout'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getSanctions } from '../../services/sanctionAPI'
import { useSiteTheme } from '../../hooks/useSiteTheme'

const LIMIT = 20

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function StatusBadge({ isDark }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        isDark
          ? 'bg-red-500/10 text-red-400 ring-red-500/20'
          : 'bg-red-50 text-red-700 ring-red-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-red-400' : 'bg-red-600'}`} />
      Sanctioned
    </span>
  )
}

function DetailPanel({ row, onClose }) {
  const { isDark } = useSiteTheme()
  if (!row) return null

  const shellCls = isDark
    ? 'w-full max-w-lg rounded-2xl border border-[#1e3a5f] bg-[#071628] p-6 shadow-2xl'
    : 'w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl'

  const fieldCls = isDark
    ? 'rounded-xl border border-[#1e3a5f] bg-[#0b2038] px-4 py-3'
    : 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'

  const aliasChipCls = isDark
    ? 'rounded-full bg-[#122d4c] px-2.5 py-1 text-xs text-[#c4d8ed]'
    : 'rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-800'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className={shellCls} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">Sanctioned Individual</p>
            <h2 className={`mt-1 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={
              isDark
                ? 'rounded-lg border border-[#1e3a5f] p-1.5 text-[#9ab4ce] transition-colors hover:text-white'
                : 'rounded-lg border border-slate-300 p-1.5 text-slate-600 transition-colors hover:bg-slate-50'
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'CNIC', value: row.cnic || '—' },
            { label: 'Province', value: row.province || '—' },
            { label: 'List Source', value: row.listSource || '—' },
            { label: 'Program', value: row.program || '—' },
            { label: 'First Seen', value: row.firstSeen ? new Date(row.firstSeen).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
            { label: 'Last Seen', value: row.lastSeen ? new Date(row.lastSeen).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className={fieldCls}>
              <p className={`text-xs ${isDark ? 'text-[#9ab4ce]' : 'text-slate-500'}`}>{label}</p>
              <p className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {Array.isArray(row.aliases) && row.aliases.length > 0 && (
          <div className={`mt-3 rounded-xl border px-4 py-3 ${isDark ? 'border-[#1e3a5f] bg-[#0b2038]' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`mb-2 text-xs ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>Known Aliases ({row.aliases.length})</p>
            <div className="flex flex-wrap gap-2">
              {row.aliases.map((alias, i) => (
                <span key={i} className={aliasChipCls}>{alias}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className={`text-xs ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>Screening Status</p>
          <StatusBadge isDark={isDark} />
        </div>

        <p className={`mt-4 text-center text-xs ${isDark ? 'text-[#5a7fa0]' : 'text-slate-500'}`}>
          Source: NACTA · Anti Terrorism Act 1997
        </p>
      </div>
    </div>
  )
}

function SanctionsCheckerPage() {
  const { t } = useTranslation()
  const { isDark } = useSiteTheme()
  const [search, setSearch] = useState('')
  const [sanctions, setSanctions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const loadMoreRef = useRef(null)

  const debouncedSearch = useDebounce(search, 400)

  const metaMuted = isDark ? 'text-[#9ab4ce]' : 'text-slate-600'
  const searchIconCls = isDark ? 'text-[#3d5f7f]' : 'text-slate-400'

  const inputCls = isDark
    ? 'w-full rounded-lg border border-[#1e3a5f] bg-[#0b2038] py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#3d5f7f] focus:border-blue-500'
    : 'w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500'

  const statsBoxCls = isDark
    ? 'rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-4 py-3 text-sm text-[#9ab4ce]'
    : 'rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm'

  const tableWrapCls = isDark ? 'overflow-hidden rounded-2xl border border-[#1e3a5f]' : 'overflow-hidden rounded-2xl border border-slate-200 shadow-sm'
  const tableCls = isDark ? 'w-full bg-[#0b2038] text-left text-sm' : 'w-full bg-white text-left text-sm'
  const theadCls = isDark ? 'bg-[#122d4c] text-[#9ab4ce]' : 'bg-slate-100 text-slate-700'
  const rowBorder = isDark ? 'border-[#1e3a5f]' : 'border-slate-200'

  useEffect(() => {
    setPage(1)
    setSanctions([])
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    const fetchSanctions = async () => {
      try {
        if (page === 1) setIsLoading(true)
        else setIsLoadingMore(true)
        setError('')
        const data = await getSanctions({ query: debouncedSearch, page, limit: LIMIT })
        if (cancelled) return
        const incoming = data.results || []
        setSanctions((prev) => (page === 1 ? incoming : [...prev, ...incoming]))
        setTotal(data.total || 0)
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to fetch sanctions')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    }
    fetchSanctions()
    return () => { cancelled = true }
  }, [debouncedSearch, page])

  const totalPages = Math.ceil(total / LIMIT)
  const hasMore = sanctions.length < total

  useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel || isLoading || isLoadingMore || !hasMore || error) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting) {
          setPage((prev) => prev + 1)
        }
      },
      { rootMargin: '180px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLoading, isLoadingMore, hasMore, error])

  return (
    <FeaturePageLayout
      title={t('features.sanctions_checker.title')}
      subtitle={t('features.sanctions_checker.subtitle')}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${searchIconCls}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or alias..."
            className={inputCls}
          />
        </div>
        <div className="flex gap-2">
          <div className={`${statsBoxCls} whitespace-nowrap`}>
            {total.toLocaleString()} records
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs font-semibold text-red-600 whitespace-nowrap flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            NACTA · PK-ATA1997
          </div>
        </div>
      </div>

      {isLoading && (
        <div className={`mb-4 flex items-center gap-2 text-sm ${metaMuted}`}>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading sanctions...
        </div>
      )}
      {!isLoading && error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <div className={tableWrapCls}>
        <table className={tableCls}>
          <thead className={theadCls}>
            <tr>
              <th className="px-4 py-3 font-semibold">Name & Aliases</th>
              <th className="px-4 py-3 font-semibold">CNIC</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell">Province</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">First Listed</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && !error && sanctions.length === 0 ? (
              <tr className={`border-t ${rowBorder}`}>
                <td className={`px-4 py-6 ${metaMuted}`} colSpan={5}>No results found for "{search}".</td>
              </tr>
            ) : (
              sanctions.map((row) => (
                <tr
                  key={row._id}
                  onClick={() => setSelected(row)}
                  className={`cursor-pointer border-t transition-colors ${
                    isDark
                      ? 'border-[#1e3a5f] text-[#c4d8ed] hover:bg-[#0d2444]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.name}</p>
                    {Array.isArray(row.aliases) && row.aliases.length > 0 && (
                      <p className={`mt-0.5 text-xs ${metaMuted}`}>
                        {row.aliases.slice(0, 2).join(', ')}{row.aliases.length > 2 ? ` +${row.aliases.length - 2} more` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.cnic || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{row.province || '—'}</td>
                  <td className={`px-4 py-3 hidden lg:table-cell text-xs ${metaMuted}`}>
                    {row.firstSeen ? new Date(row.firstSeen).toLocaleDateString('en-PK', { year: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge isDark={isDark} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={`mt-4 flex items-center justify-between text-sm ${metaMuted}`}>
          <p>
            Loaded {sanctions.length} of {total} records (page {Math.min(page, totalPages)} of {totalPages})
          </p>
          <button
            type="button"
            disabled={!hasMore || isLoadingMore}
            onClick={() => setPage((p) => p + 1)}
            className={
              isDark
                ? 'rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-3 py-1.5 text-xs font-semibold text-[#9ab4ce] disabled:opacity-40 hover:border-[#3b82f6] hover:text-white transition-colors'
                : 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition-colors'
            }
          >
            {hasMore ? (isLoadingMore ? 'Loading...' : 'Load more') : 'All loaded'}
          </button>
        </div>
      )}

      <div ref={loadMoreRef} className="h-1" />

      <p className={`mt-6 text-center text-xs ${isDark ? 'text-[#3d5f7f]' : 'text-slate-500'}`}>
        Data source: NACTA Pakistan · opensanctions.org · Anti Terrorism Act 1997
      </p>

      <DetailPanel row={selected} onClose={() => setSelected(null)} />
    </FeaturePageLayout>
  )
}

export default SanctionsCheckerPage
