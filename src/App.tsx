import { useState, useEffect } from 'react'
import type { Expense, Timeframe } from './types'
import { useLocalStorage } from './useLocalStorage'
import { useFilteredExpenses, useTotal } from './analytics'
import { seedExpenses } from './seed'
import Header from './components/Header'
import ExpenseForm from './components/ExpenseForm'
import Analytics from './components/Analytics'

export default function App() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('receipts_data', [])
  const [hydrated, setHydrated] = useState(false)
  const [timeframe, setTimeframe] = useState<Timeframe>('this-week')

  useEffect(() => {
    if (expenses.length === 0) {
      setExpenses(seedExpenses)
    }
    setHydrated(true)
  }, [])

  const filtered = useFilteredExpenses(expenses, timeframe)
  const total = useTotal(filtered)

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Loading&hellip;</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8">
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
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
              <Analytics filtered={filtered} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
