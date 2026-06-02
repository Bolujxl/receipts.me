import type { Expense } from './types'

const today = new Date()

function daysAgo(days: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export const seedExpenses: Expense[] = [
  {
    id: crypto.randomUUID(),
    amount: 42.5,
    category: 'food',
    date: daysAgo(1),
  },
  {
    id: crypto.randomUUID(),
    amount: 15.0,
    category: 'transport',
    date: daysAgo(2),
  },
  {
    id: crypto.randomUUID(),
    amount: 29.99,
    category: 'data',
    date: daysAgo(3),
  },
  {
    id: crypto.randomUUID(),
    amount: 65.0,
    category: 'fun',
    date: daysAgo(5),
  },
  {
    id: crypto.randomUUID(),
    amount: 8.75,
    category: 'other',
    date: daysAgo(6),
  },
]
