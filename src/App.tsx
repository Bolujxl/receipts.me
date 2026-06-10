import { useState, useEffect } from 'react'
import type { Expense, Timeframe } from './types'
import { useLocalStorage } from './useLocalStorage'
import { useFilteredExpenses, useTotal } from './analytics'
import { ExpensesSchema } from './lib/validation'
import Header from './components/Header'
import ExpenseForm from './components/ExpenseForm'
import Analytics from './components/Analytics'
import EmptyState from './components/EmptyState'
import ExpenseList from './components/ExpenseList'

const expenseValidator = (parsed: unknown): Expense[] | null => {
  const result = ExpensesSchema.safeParse(parsed)
  return result.success ? result.data : null
}

export default function App() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(
    'receipts_data',
    [],
    expenseValidator
  )
  const [hydrated, setHydrated] = useState(false)
  const [timeframe, setTimeframe] = useState<Timeframe>('this-week')

  useEffect(() => {
    setHydrated(true)
  }, [])

  const filtered = useFilteredExpenses(expenses, timeframe)
  const total = useTotal(filtered)

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <p className="text-text-faint">Loading&hellip;</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
          {/* Left column: header + form */}
          <div className="space-y-8">
            <Header
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              total={total}
            />
            <ExpenseForm
              onAdd={(e) => setExpenses((prev) => [e, ...prev])}
            />
          </div>

          {/* Right column: analytics */}
          <div className="lg:pt-[72px]">
            <div className="bg-bg-surface border border-bg-border p-6 rounded-xl">
              {expenses.length > 0 ? (
                <Analytics filtered={filtered} />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>

        {expenses.length > 0 && (
          <ExpenseList filtered={filtered} timeframe={timeframe} />
        )}
      </div>
    </div>
  )
}
