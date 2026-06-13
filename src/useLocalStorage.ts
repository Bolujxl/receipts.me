import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (parsed: unknown) => T | null
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return initialValue
      const parsed: unknown = JSON.parse(stored)
      if (validator) {
        const validated = validator(parsed)
        if (validated === null) {
          console.warn(`useLocalStorage: validation failed for key "${key}", using initial value`)
          return initialValue
        }
        return validated
      }
      return parsed as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // TODO [Audit 03 §1]: surface storage-unavailable state to UI when consistent write failures occur
    }
  }, [key, value])

  const set = useCallback((val: T | ((prev: T) => T)) => {
    // Stable deps: setValue is React's useState setter — guaranteed stable across renders
    setValue(val)
  }, [])

  return [value, set] as const
}
