import type { Expense } from './types'

const CATEGORIES = ['food', 'transport', 'housing', 'bills', 'health', 'shopping', 'fun', 'data', 'other'] as const

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

const amounts = [
  450, 825, 1200, 3299, 1895, 675, 2250, 540, 999, 1450,
  3500, 799, 1625, 2750, 499, 895, 1175, 2100, 650, 3295,
  9999, 425, 1550, 875, 1925, 570, 12500, 349, 2499, 6750,
  895, 1125, 1450, 399, 2599, 750, 1899, 350, 3200, 1450,
  4999, 675, 995, 2299, 825, 1595, 1100, 2750, 645, 3499,
]

export const seedExpenses: Expense[] = Array.from({ length: 50 }, (_, i) => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
  amountCents: amounts[i],
  category: CATEGORIES[randomBetween(0, CATEGORIES.length - 1)],
  date: daysAgo(randomBetween(0, 13)),
}))
