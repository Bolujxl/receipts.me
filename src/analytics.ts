import { useMemo } from 'react'
import type { Expense, Timeframe } from './types'

function startOfWeek(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function endOfWeek(d: Date) {
  const sunday = new Date(startOfWeek(d))
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

export function filterByTimeframe(expenses: Expense[], timeframe: Timeframe): Expense[] {
  const now = new Date()
  const thisMonday = startOfWeek(now)
  const thisSunday = endOfWeek(now)

  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(lastMonday.getDate() - 7)
  const lastSunday = new Date(thisSunday)
  lastSunday.setDate(lastSunday.getDate() - 7)

  switch (timeframe) {
    case 'this-week':
      return expenses.filter((e) => {
        const d = new Date(e.date)
        return d >= thisMonday && d <= thisSunday
      })
    case 'last-week':
      return expenses.filter((e) => {
        const d = new Date(e.date)
        return d >= lastMonday && d <= lastSunday
      })
    case 'all-time':
      return expenses
  }
}

export function useFilteredExpenses(expenses: Expense[], timeframe: Timeframe) {
  return useMemo(() => filterByTimeframe(expenses, timeframe), [expenses, timeframe])
}

export function useTotal(filtered: Expense[]) {
  return useMemo(() => filtered.reduce((sum, e) => sum + e.amount, 0), [filtered])
}

export function useCategoryTotals(filtered: Expense[]) {
  return useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered) {
      map[e.category] = (map[e.category] || 0) + e.amount
    }
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [filtered])
}

export function useDailyTotals(filtered: Expense[]) {
  return useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const days: { day: string; amount: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const dayLabel = dayNames[d.getDay()]
      const total = filtered
        .filter((e) => e.date === iso)
        .reduce((sum, e) => sum + e.amount, 0)
      days.push({ day: dayLabel, amount: total })
    }

    return days
  }, [filtered])
}
