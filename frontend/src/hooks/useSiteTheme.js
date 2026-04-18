import { useSyncExternalStore } from 'react'

function subscribe(onStoreChange) {
  window.addEventListener('theme-change', onStoreChange)
  window.addEventListener('storage', onStoreChange)
  return () => {
    window.removeEventListener('theme-change', onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

function getThemeSnapshot() {
  const fromDom = document.documentElement.getAttribute('data-theme')
  if (fromDom === 'light' || fromDom === 'dark') return fromDom
  try {
    const ls = localStorage.getItem('theme')
    if (ls === 'light' || ls === 'dark') return ls
  } catch {
    /* ignore */
  }
  return 'dark'
}

/** Matches HomeHeader / HomePage — reads `data-theme` on `<html>` and reacts to theme toggles. */
export function useSiteTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => 'dark')
  const isDark = theme === 'dark'
  return { theme, isDark }
}
