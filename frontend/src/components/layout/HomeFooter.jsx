import { useSiteTheme } from '../../hooks/useSiteTheme'

function HomeFooter({ contentShell }) {
  const { isDark } = useSiteTheme()

  return (
    <footer
      className={
        isDark
          ? 'w-full bg-[#0f172a] py-12'
          : 'w-full border-t border-slate-200 bg-slate-100 py-12'
      }
    >
      <div className={contentShell}>
        <div
          className={`flex flex-col gap-6 py-4 text-sm md:flex-row md:justify-between ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <div>
            <img
              src="/logo/logo.png"
              alt="AdvokateDesk"
              className={`h-12 w-auto object-contain ${isDark ? 'brightness-0 invert' : ''}`}
            />
            <p className={`mt-2 max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Institutional legal access with precision, trust, and secure collaboration.
            </p>
          </div>
          <div className="flex flex-wrap gap-10">
            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Case Resources</p>
              <p className="mt-2">Knowledge Base</p>
              <p>Consultation Policies</p>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Contact</p>
              <p className="mt-2">support@advokatedesk.com</p>
              <p>+94 000 0000</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default HomeFooter
