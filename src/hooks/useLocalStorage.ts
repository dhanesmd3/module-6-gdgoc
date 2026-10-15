import { useState, useEffect } from 'react'

/**
 * A generic hook that syncs a piece of state with localStorage.
 * Works with any serializable type T (string, boolean, object, array, etc.)
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      // localStorage might be unavailable (e.g. private browsing) — fall back safely
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // ignore write errors
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

export default useLocalStorage
