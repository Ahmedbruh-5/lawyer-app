import FeaturePageLayout from './FeaturePageLayout'
import { useSiteTheme } from '../../hooks/useSiteTheme'

const filings = [
  { caseRef: 'ARB-2026-0017', claimant: 'Delta Trading Ltd', stage: 'Drafting Statement of Claim' },
  { caseRef: 'ARB-2026-0021', claimant: 'Nova Infrastructure', stage: 'Awaiting Tribunal Confirmation' },
  { caseRef: 'ARB-2026-0030', claimant: 'Horizon Telecom', stage: 'Evidence Upload In Progress' },
]

function ArbitrationFilingPage() {
  const { isDark } = useSiteTheme()
  const cardCls = isDark
    ? 'rounded-2xl border border-[#1e3a5f] bg-[#0b2038] p-5'
    : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

  return (
    <FeaturePageLayout
      title="Arbitration Filing"
      subtitle="Prepare and submit arbitration matters through a guided filing workflow. Dummy filing records are displayed."
    >
      <div className="space-y-3">
        {filings.map((filing) => (
          <article key={filing.caseRef} className={cardCls}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2563eb]">{filing.caseRef}</p>
            <h2 className={`mt-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{filing.claimant}</h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-[#c4d8ed]' : 'text-slate-600'}`}>{filing.stage}</p>
          </article>
        ))}
      </div>
    </FeaturePageLayout>
  )
}

export default ArbitrationFilingPage
