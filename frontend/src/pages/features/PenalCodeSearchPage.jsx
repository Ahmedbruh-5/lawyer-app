import FeaturePageLayout from './FeaturePageLayout'
import { useEffect, useState } from 'react'
import { getPenalCodes } from '../../services/penalcodeAPIs'
import { useSiteTheme } from '../../hooks/useSiteTheme'

function PenalCodeDetailModal({ item, onClose }) {
  const { isDark } = useSiteTheme()
  if (!item) return null

  const shellCls = isDark
    ? 'w-full max-w-3xl rounded-2xl border border-[#1e3a5f] bg-[#071628] p-5 shadow-2xl'
    : 'w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl'

  const bodyCls = isDark
    ? 'max-h-[60vh] overflow-auto rounded-xl border border-[#1e3a5f] bg-[#0b2038] p-4'
    : 'max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4'

  const closeCls = isDark
    ? 'rounded-lg border border-[#1e3a5f] px-2 py-1 text-xs text-[#9ab4ce] hover:text-white'
    : 'rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className={shellCls} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#2563eb]">{item.chapter || 'Chapter'}</p>
            <h2 className={`mt-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              PC {item.section} - {item.title || 'Untitled Section'}
            </h2>
            {item.chapterTitle && (
              <p className={`mt-1 text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>{item.chapterTitle}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className={closeCls}>
            Close
          </button>
        </div>

        <div className={bodyCls}>
          <p className={`whitespace-pre-wrap text-sm leading-7 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {item.content || 'No content available.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function PenalCodeSearchPage() {
  const { isDark } = useSiteTheme()
  const [statutes, setStatutes] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatute, setSelectedStatute] = useState(null)

  const inputCls = isDark
    ? 'w-full rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-4 py-3 text-sm text-white outline-none focus:border-blue-500'
    : 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500'

  const cardCls = isDark
    ? 'cursor-pointer rounded-2xl border border-[#1e3a5f] bg-[#0b2038] p-5 transition-colors hover:border-[#3b82f6]'
    : 'cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-400'

  const badgeCls = isDark
    ? 'rounded-full border border-[#1e3a5f] bg-[#122d4c] px-3 py-1 text-xs text-[#9ab4ce]'
    : 'rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600'

  useEffect(() => {
    const fetchPenalCodes = async () => {
      try {
        setIsLoading(true)
        setError('')
        const data = await getPenalCodes({ q: search, limit: 200 })
        setStatutes(data.data || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load penal codes')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPenalCodes()
  }, [search])

  const metaMuted = isDark ? 'text-[#9ab4ce]' : 'text-slate-600'

  return (
    <FeaturePageLayout
      title="Penal Code Search"
      subtitle="Search and review Pakistan Penal Code sections from the database."
    >
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by section, title, chapter, or content..."
          className={inputCls}
        />
      </div>

      {isLoading && <p className={`text-sm ${metaMuted}`}>Loading penal codes...</p>}
      {!isLoading && error && <p className="text-sm text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="space-y-3">
          {statutes.map((statute) => (
            <article
              key={statute._id}
              onClick={() => setSelectedStatute(statute)}
              className={cardCls}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  PC {statute.section} - {statute.title || 'Untitled Section'}
                </h2>
                <span className={badgeCls}>
                  {statute.chapter}
                </span>
              </div>
              {statute.chapterTitle && (
                <p className={`mt-2 text-sm ${metaMuted}`}>{statute.chapterTitle}</p>
              )}
              {statute.content && (
                <p className={`mt-3 line-clamp-4 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{statute.content}</p>
              )}
            </article>
          ))}

          {!statutes.length && (
            <p className={`text-sm ${metaMuted}`}>No penal code sections matched your search.</p>
          )}
        </div>
      )}

      <PenalCodeDetailModal item={selectedStatute} onClose={() => setSelectedStatute(null)} />
    </FeaturePageLayout>
  )
}

export default PenalCodeSearchPage
