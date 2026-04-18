import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, splitText, stagger } from 'animejs'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    label: 'Hire a Lawyer',
    desc: 'Connect with vetted counsel in 24h',
    path: '/features/hire-lawyer',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    label: 'Free Consultation',
    desc: 'Initial advice at no cost',
    path: '/features/free-consultation',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.966 8.966 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    label: 'Penal Code Search',
    desc: 'Browse statutes & case law',
    path: '/features/penal-code-search',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    label: 'Sanctions Checker',
    desc: 'Screen parties & entities',
    path: '/features/sanctions-checker',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    label: 'Statutes',
    desc: 'Featured acts & ordinances from the database',
    path: '/features/statutes',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375H8.25m8.25 6h-9m12.75 6H3.75m15.75-9h-15m11.25-7.5H8.25A2.25 2.25 0 0 0 6 6v12a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 18V6a2.25 2.25 0 0 0-2.25-2.25Z" />
      </svg>
    ),
    label: 'Legal Document Drafter',
    desc: 'Draft legal templates quickly',
    path: '/features/document-drafter',
  },
]

const stats = [
  { value: '1,150+', label: 'Verified Specialists' },
  { value: '4,320+', label: 'Active Matters' },
  { value: '98%', label: 'Client Retention' },
]

function HeroHome({ contentShell, theme = 'dark' }) {
  const { t, i18n } = useTranslation()
  const rotatingPhrase = t('hero.rotating')
  const isDark = theme === 'dark'
  const rotatingWordsRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useLayoutEffect(() => {
    const el = rotatingWordsRef.current
    if (!el || !rotatingPhrase.trim()) return undefined

    const splitter = splitText(el, {
      words: { wrap: 'clip' },
    })
    const { words } = splitter
    if (!words?.length) {
      splitter.revert()
      return undefined
    }

    const wordAnimation = animate(words, {
      y: [
        { to: ['100%', '0%'] },
        { to: '-100%', delay: 750, ease: 'in(3)' },
      ],
      duration: 750,
      ease: 'out(3)',
      delay: stagger(100),
      loop: true,
    })

    wordAnimation.play()

    return () => {
      wordAnimation.revert()
      splitter.revert()
    }
  }, [rotatingPhrase, i18n.language])

  useLayoutEffect(() => {
    const fadeInAnimation = animate('.hero-fade', {
      y: [20, 0],
      duration: 700,
      ease: 'out(3)',
      delay: stagger(90),
    })

    return () => {
      fadeInAnimation.revert()
    }
  }, [])

  return (
    <section
      className={`relative w-full overflow-hidden min-h-screen flex flex-col transition-colors ${
        isDark ? 'bg-[#020c1b]' : 'bg-slate-50'
      }`}
    >
      {/* Animated grid background */}
      
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,91,172,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(0,91,172,0.10) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glowing orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#003b73]/30 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-[#1d4ed8]/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[#003b73]/20 blur-[80px]" />
      <div
        className="pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-blue-500/20 blur-[120px] transition-transform duration-100"
        style={{
          transform: `translate(${mousePos.x - 150}px, ${mousePos.y - 150}px)`,
        }}
      />

      {/* Subtle horizontal rule accent */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#3b82f6]/60 to-[#60a5fa]/60" />

      <div className={`${contentShell} relative flex flex-col justify-center py-20 lg:py-28 flex-1`}>

        {/* Badge */}
        <div className="hero-fade">
          <span
            className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${
              isDark
                ? 'border-[#1e3a5f] bg-[#0a1e35] text-[#60a5fa]'
                : 'border-slate-300 bg-white text-blue-600'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
            {t('hero.badge')}
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`hero-fade max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {t('hero.headline')}<br />
          <span className="inline-block overflow-hidden leading-tight pb-2">
            <span
              ref={rotatingWordsRef}
              key={`${i18n.language}-${rotatingPhrase}`}
              className="inline-block text-[#3b82f6]"
            >
              {rotatingPhrase}
            </span>
          </span>
        </h1>

        {/* Subtext */}
        <p className={`hero-fade mt-6 max-w-2xl text-base md:text-lg ${isDark ? 'text-[#94aec4]' : 'text-slate-600'}`}>
          {t('hero.subtext')}
        </p>

        {/* Search bar */}
        {/* <div className="hero-fade mt-10 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder={t('hero.search_placeholder')}
            className={`h-13 flex-1 rounded-xl border px-5 text-sm outline-none transition-colors ${
              isDark
                ? 'border-[#1e3a5f] bg-[#071628] text-slate-200 placeholder:text-[#3d5f7f] focus:border-[#3b82f6]'
                : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-blue-500'
            }`}
            style={{ height: '52px' }}
          />
          <button
            className="h-13 rounded-xl bg-[#1d4ed8] px-7 text-sm font-semibold text-white hover:bg-[#2563eb] transition-colors whitespace-nowrap"
            style={{ height: '52px' }}
          >
            {t('hero.cta')}
          </button>
        </div> */}

        {/* Feature cards */}
        <div className="hero-fade mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {features.map((f) => (
            <Link
              key={f.label}
              to={f.path}
              className={`feat-card group cursor-pointer rounded-2xl border p-4 backdrop-blur-sm transition-all ${
                isDark
                  ? 'border-[#1e3a5f] bg-[#071628]/80 hover:border-[#3b82f6]/60 hover:bg-[#0d2444]'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f3460] text-[#60a5fa] group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{f.label}</p>
              <p className={`mt-1 text-xs ${isDark ? 'text-[#5a7fa0]' : 'text-slate-600'}`}>{f.desc}</p>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="hero-fade mt-12 flex flex-wrap gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className="stat-item flex items-center gap-3">
              {i > 0 && <div className="h-8 w-px bg-[#1e3a5f]" />}
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                <p className={`text-xs ${isDark ? 'text-[#5a7fa0]' : 'text-slate-600'}`}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default HeroHome