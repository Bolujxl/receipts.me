export type Category =
  | 'food'
  | 'transport'
  | 'housing'
  | 'bills'
  | 'health'
  | 'shopping'
  | 'fun'
  | 'data'
  | 'other'

export interface Expense {
  id: string
  amountCents: number
  category: Category
  date: string
}

export const CATEGORIES: Category[] = [
  'food',
  'transport',
  'housing',
  'bills',
  'health',
  'shopping',
  'fun',
  'data',
  'other',
]

export type Timeframe = 'this-week' | 'last-week' | 'all-time'
