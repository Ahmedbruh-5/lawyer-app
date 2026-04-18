import FeaturePageLayout from './FeaturePageLayout'
import { useSiteTheme } from '../../hooks/useSiteTheme'

const consultationSlots = [
  { type: 'Family Law', consultant: 'Nirmani Cooray', nextSlot: 'Today, 4:30 PM', duration: '30 mins' },
  { type: 'Commercial Law', consultant: 'Yohan Samarasekara', nextSlot: 'Tomorrow, 9:00 AM', duration: '45 mins' },
  { type: 'Property Disputes', consultant: 'Rukshan Dias', nextSlot: 'Tomorrow, 2:00 PM', duration: '30 mins' },
]

function FreeConsultationPage() {
  const { isDark } = useSiteTheme()
  const cardCls = isDark
    ? 'rounded-2xl border border-[#1e3a5f] bg-[#0b2038] p-5'
    : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

  return (
    <FeaturePageLayout
      title="Free Consultation"
      subtitle="Preview available introductory consultation slots before committing. Dummy scheduling data shown."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {consultationSlots.map((slot) => (
          <article key={`${slot.type}-${slot.consultant}`} className={cardCls}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2563eb]">{slot.type}</p>
            <h2 className={`mt-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{slot.consultant}</h2>
            <p className={`mt-3 text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>Next slot: {slot.nextSlot}</p>
            <p className={`text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>Duration: {slot.duration}</p>
            <button className="mt-4 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]">
              Book Free Slot
            </button>
          </article>
        ))}
      </div>
    </FeaturePageLayout>
  )
}

export default FreeConsultationPage
