import { useEffect, useState } from 'react'

/**
 * Returns a value that updates after `delay` ms of stability in `value`.
 * Use for search fields so network work does not run on every keystroke.
 */
export function useDebounce(value, delay = 320) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
