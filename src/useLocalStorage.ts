import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable
    }
  }, [key, value])

  const set = useCallback((val: T | ((prev: T) => T)) => {
    setValue(val)
  }, [])

  return [value, set] as const
}
