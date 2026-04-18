import { Link } from 'react-router-dom'
import HomeHeader from '../../components/layout/HomeHeader'
import HomeFooter from '../../components/layout/HomeFooter'
import { useSiteTheme } from '../../hooks/useSiteTheme'

const contentShell = 'mx-auto w-full max-w-[1600px] px-6 lg:px-14'

function FeaturePageLayout({ title, subtitle, children }) {
  const { isDark } = useSiteTheme()

  return (
    <main
      className={
        isDark
          ? 'min-h-screen w-full bg-[#020c1b] text-slate-100'
          : 'min-h-screen w-full bg-slate-50 text-slate-900'
      }
    >
      <HomeHeader contentShell={contentShell} />
      <section
        className={
          isDark
            ? 'w-full bg-[#061427] py-12'
            : 'w-full border-b border-slate-200 bg-white py-12'
        }
      >
        <div className={contentShell}>
          <Link
            to="/home"
            className={
              isDark
                ? 'inline-flex rounded-lg border border-[#1e3a5f] bg-[#0b2038] px-3 py-1.5 text-xs font-semibold text-[#9ab4ce] transition-colors hover:border-[#3b82f6] hover:text-white'
                : 'inline-flex rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:bg-white hover:text-slate-900'
            }
          >
            Back to Home
          </Link>
          <h1 className={`mt-6 text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
          <p className={`mt-3 max-w-3xl text-sm ${isDark ? 'text-[#9ab4ce]' : 'text-slate-600'}`}>{subtitle}</p>
        </div>
      </section>
      <section className={isDark ? 'w-full bg-[#020c1b] py-12' : 'w-full bg-slate-50 py-12'}>
        <div className={contentShell}>{children}</div>
      </section>
      <HomeFooter contentShell={contentShell} />
    </main>
  )
}

export default FeaturePageLayout
