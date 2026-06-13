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
  return useMemo(() => filtered.reduce((sum, e) => sum + e.amountCents, 0), [filtered])
}

export function useCategoryTotals(filtered: Expense[]) {
  return useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered) {
      map[e.category] = (map[e.category] || 0) + e.amountCents
    }
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [filtered])
}

export function useLastWeekCategoryTotals(allExpenses: Expense[]) {
  return useMemo(() => {
    const lastWeekFiltered = filterByTimeframe(allExpenses, 'last-week')
    const map: Record<string, number> = {}
    for (const e of lastWeekFiltered) {
      map[e.category] = (map[e.category] || 0) + e.amountCents
    }
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [allExpenses])
}

export function useDailyTotals(filtered: Expense[]) {
  return useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const days: { day: string; amount: number; dominantCategory: string }[] = []

    const buckets = new Map<string, { total: number; byCategory: Map<string, number> }>()
    for (const e of filtered) {
      let bucket = buckets.get(e.date)
      if (!bucket) {
        bucket = { total: 0, byCategory: new Map() }
        buckets.set(e.date, bucket)
      }
      bucket.total += e.amountCents
      bucket.byCategory.set(e.category, (bucket.byCategory.get(e.category) || 0) + e.amountCents)
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const dayLabel = dayNames[d.getDay()]
      const bucket = buckets.get(iso)

      if (!bucket) {
        days.push({ day: dayLabel, amount: 0, dominantCategory: 'other' })
        continue
      }

      let dominantCategory = 'other'
      let maxAmount = 0
      for (const [cat, amt] of bucket.byCategory) {
        if (amt > maxAmount) {
          maxAmount = amt
          dominantCategory = cat
        }
      }

      days.push({ day: dayLabel, amount: bucket.total, dominantCategory })
    }

    return days
  }, [filtered])
}

export function useWeeklyTrend(expenses: Expense[]) {
  return useMemo(() => {
    const weeks: { label: string; amount: number }[] = []
    const now = new Date()
    const thisMonday = new Date(now)
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    thisMonday.setDate(diff)
    thisMonday.setHours(0, 0, 0, 0)

    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(thisMonday)
      weekStart.setDate(weekStart.getDate() - w * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const total = expenses
        .filter((e) => {
          const d = new Date(e.date)
          return d >= weekStart && d <= weekEnd
        })
        .reduce((sum, e) => sum + e.amountCents, 0)

      const weekLabel = new Intl.DateTimeFormat(navigator.language || 'en-US', {
        month: 'short',
        day: 'numeric',
      }).format(weekStart)

      weeks.push({ label: weekLabel, amount: total })
    }

    return weeks
  }, [expenses])
}
