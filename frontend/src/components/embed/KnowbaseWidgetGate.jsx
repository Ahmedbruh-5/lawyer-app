import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { getStoredAccessToken } from '../../utils/authTokenStorage'

const WIDGET_SCRIPT_URL = 'https://app.knowbase.ai/assets/widget.js'

function subscribeAuth(listener) {
  window.addEventListener('advokate-auth-change', listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener('advokate-auth-change', listener)
    window.removeEventListener('storage', listener)
  }
}

function getLoggedInSnapshot() {
  return getStoredAccessToken().trim() !== ''
}

function isWidgetAllowed(pathname, isLoggedIn, hasEnvToken) {
  if (!hasEnvToken || !isLoggedIn) return false
  // Bubble only on marketing home (HeroHome + HomePage); hidden on features, auth, admin, etc.
  return pathname === '/home'
}

function cleanupKnowbase() {
  try {
    window.KnowbaseChat?.destroy?.()
  } catch {
    /* ignore */
  }
}

/**
 * Knowbase.ai bubble chat: only when JWT is present and route is `/home`
 * (Hero + rest of HomePage). Elsewhere the widget is torn down so it does not overlay the app.
 */
export default function KnowbaseWidgetGate() {
  const location = useLocation()
  const isLoggedIn = useSyncExternalStore(
    subscribeAuth,
    getLoggedInSnapshot,
    () => false,
  )
  const envToken = import.meta.env.VITE_KNOWBASE_TOKEN?.trim()
  const gateRef = useRef({
    pathname: location.pathname,
    loggedIn: isLoggedIn,
    token: envToken,
  })
  gateRef.current = {
    pathname: location.pathname,
    loggedIn: isLoggedIn,
    token: envToken,
  }

  const allow = isWidgetAllowed(location.pathname, isLoggedIn, Boolean(envToken))

  useEffect(() => {
    function tryInit() {
      const { pathname, loggedIn, token } = gateRef.current
      if (!token || !isWidgetAllowed(pathname, loggedIn, true)) return
      window.KnowbaseChat?.init?.({ token })
    }

    if (!allow) {
      cleanupKnowbase()
      return
    }

    let cancelled = false

    if (window.KnowbaseChat?.init) {
      tryInit()
      return () => {
        cancelled = true
        cleanupKnowbase()
      }
    }

    let script = document.querySelector('script[data-knowbase-widget]')
    if (!script) {
      script = document.createElement('script')
      script.src = WIDGET_SCRIPT_URL
      script.async = true
      script.dataset.knowbaseWidget = 'true'
      document.body.appendChild(script)
    }

    const onLoad = () => {
      if (cancelled) return
      tryInit()
    }
    script.addEventListener('load', onLoad)
    if (window.KnowbaseChat?.init) tryInit()

    return () => {
      cancelled = true
      script.removeEventListener('load', onLoad)
      cleanupKnowbase()
    }
  }, [allow, envToken])

  return null
}
