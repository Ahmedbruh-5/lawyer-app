import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getStoredAccessToken,
  getStoredUser,
  clearStoredAccessToken,
} from '../../utils/authTokenStorage'

function scrollToHomeSection(sectionId) {
  const el = document.getElementById(sectionId)
  if (!el) return
  const headerOffset = 96
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

function HomeHeader() {
  const { t, i18n } = useTranslation()
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }))
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', i18n.language)
    // Keep html in LTR so third-party widgets (chat, embeds) don't break in RTL mode.
    document.documentElement.setAttribute('dir', 'ltr')
    const appRoot = document.getElementById('root')
    if (appRoot) {
      appRoot.setAttribute('dir', i18n.language === 'ur' ? 'rtl' : 'ltr')
    }
  }, [i18n.language])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  const toggleLanguage = () => {
    const nextLanguage = i18n.language === 'ur' ? 'en' : 'ur'
    i18n.changeLanguage(nextLanguage)
    localStorage.setItem('lang', nextLanguage)
  }

  useEffect(() => {
    const syncUserFromStorage = () => {
      const token = getStoredAccessToken()
      const storedUser = getStoredUser()
      if (token && storedUser) {
        setUser(storedUser)
      } else {
        setUser(null)
      }
    }

    syncUserFromStorage()
    window.addEventListener('storage', syncUserFromStorage)
    window.addEventListener('focus', syncUserFromStorage)

    return () => {
      window.removeEventListener('storage', syncUserFromStorage)
      window.removeEventListener('focus', syncUserFromStorage)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    clearStoredAccessToken()
    setUser(null)
    navigate('/')
  }

  const initials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className={`sticky top-0 z-20 w-full border-b backdrop-blur ${
      theme === 'dark'
        ? 'border-[#1e3a5f]/60 bg-[#020c1b]/90'
        : 'border-slate-300 bg-white/90'
    }`}>
      <div className="w-full px-4 py-1 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">

          <Link to="/home" className="shrink-0">
            <img src="/logo/logo.png" alt="AdvokateDesk"
              className="h-16 w-auto md:h-20 lg:h-24 object-contain" />
          </Link>

          <nav className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium sm:gap-x-5 md:text-sm lg:gap-x-7 ${
            theme === 'dark' ? 'text-[#8fafc9]' : 'text-slate-600'
          }`}>
            <Link
              to="/home#about"
              onClick={(e) => {
                if (location.pathname !== '/home') return
                e.preventDefault()
                scrollToHomeSection('about')
                window.history.replaceState(null, '', '/home#about')
              }}
              className={theme === 'dark' ? 'whitespace-nowrap hover:text-white transition-colors' : 'whitespace-nowrap hover:text-slate-900 transition-colors'}
            >
              {t('header.nav_about')}
            </Link>
            <Link
              to="/features/hire-lawyer"
              className={theme === 'dark' ? 'whitespace-nowrap hover:text-white transition-colors' : 'whitespace-nowrap hover:text-slate-900 transition-colors'}
            >
              {t('header.nav_hire_lawyer')}
            </Link>
            <Link
              to="/home#faq"
              onClick={(e) => {
                if (location.pathname !== '/home') return
                e.preventDefault()
                scrollToHomeSection('faq')
                window.history.replaceState(null, '', '/home#faq')
              }}
              className={theme === 'dark' ? 'whitespace-nowrap hover:text-white transition-colors' : 'whitespace-nowrap hover:text-slate-900 transition-colors'}
            >
              {t('header.nav_faq')}
            </Link>
            <Link
              to="/features/statutes"
              className={theme === 'dark' ? 'whitespace-nowrap hover:text-white transition-colors' : 'whitespace-nowrap hover:text-slate-900 transition-colors'}
            >
              {t('header.nav_statutes')}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                theme === 'dark'
                  ? 'border-[#1e3a5f] bg-[#0a1628] text-[#c4d8ed] hover:border-[#3b82f6]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-500'
              }`}
            >
              {t('header.lang_button')}
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`rounded-lg border p-2 transition-colors ${
                theme === 'dark'
                  ? 'border-[#1e3a5f] bg-[#0a1628] text-[#c4d8ed] hover:border-[#3b82f6]'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-500'
              }`}
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3c-.02.27-.03.54-.03.82a8 8 0 0 0 9 8.97c.27 0 .55-.01.82-.03Z" />
                </svg>
              )}
            </button>
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setOpen(prev => !prev)}
                  className="flex items-center gap-2 rounded-full focus:outline-none">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-[#1d4ed8]" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-sm font-bold ring-2 ring-[#1d4ed8]/50">
                      {initials}
                    </div>
                  )}
                </button>

                {open && (
                  <div className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl py-1 ${
                    theme === 'dark'
                      ? 'border-[#1e3a5f] bg-[#0a1628]'
                      : 'border-slate-300 bg-white'
                  }`}>
                    <div className={`px-4 py-3 border-b ${
                      theme === 'dark' ? 'border-[#1e3a5f]' : 'border-slate-200'
                    }`}>
                      <p className={`text-sm font-semibold truncate ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>{user.fullName}</p>
                      <p className={`text-xs truncate ${
                        theme === 'dark' ? 'text-[#8fafc9]' : 'text-slate-500'
                      }`}>{user.email}</p>
                    </div>
                    <Link to="/home" onClick={() => setOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-[#8fafc9] hover:text-white hover:bg-[#1e3a5f]/40'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}>
                      {t('header.dashboard')}
                    </Link>
                    <button onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:text-red-300 hover:bg-[#1e3a5f]/40'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }`}>
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  theme === 'dark' ? 'text-[#fdfdfd] hover:text-white' : 'text-slate-700 hover:text-slate-900'
                }`}>
                  {t('header.login')}
                </Link>
                <Link to="/signup" className="rounded-xl bg-[#1d4ed8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2563eb] transition-colors">
                  {t('header.get_started')}
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}

export default HomeHeader