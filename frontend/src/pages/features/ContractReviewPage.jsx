import FeaturePageLayout from './FeaturePageLayout'
import { useSiteTheme } from '../../hooks/useSiteTheme'

const contracts = [
  { name: 'Vendor Master Agreement', score: '92/100', flag: 'Termination clause missing notice period' },
  { name: 'Employment Offer Letter', score: '88/100', flag: 'Non-compete language is too broad' },
  { name: 'Service Level Agreement', score: '90/100', flag: 'Liability cap not clearly defined' },
]

function ContractReviewPage() {
  const { isDark } = useSiteTheme()
  const cardCls = isDark
    ? 'rounded-2xl border border-[#1e3a5f] bg-[#0b2038] p-5'
    : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

  return (
    <FeaturePageLayout
      title="Contract Review"
      subtitle="Upload and inspect agreements with AI-assisted risk highlights. Dummy review results are shown."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {contracts.map((contract) => (
          <article key={contract.name} className={cardCls}>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{contract.name}</h2>
            <p className="mt-2 text-sm text-[#2563eb]">Compliance Score: {contract.score}</p>
            <p className={`mt-3 text-sm ${isDark ? 'text-[#c4d8ed]' : 'text-slate-600'}`}>{contract.flag}</p>
          </article>
        ))}
      </div>
    </FeaturePageLayout>
  )
}

export default ContractReviewPage
