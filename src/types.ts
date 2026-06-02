export type Category = 'food' | 'transport' | 'data' | 'fun' | 'other'

export interface Expense {
  id: string
  amount: number
  category: Category
  date: string
}

export const CATEGORIES: Category[] = ['food', 'transport', 'data', 'fun', 'other']

export type Timeframe = 'this-week' | 'last-week' | 'all-time'
