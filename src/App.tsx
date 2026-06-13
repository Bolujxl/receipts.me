import { useState, useEffect } from 'react'
import type { Expense, Timeframe } from './types'
import { useLocalStorage } from './useLocalStorage'
import { useFilteredExpenses, useTotal } from './analytics'
import { ExpensesSchema } from './lib/validation'
import CornerMark from './components/CornerMark'
import SentenceHeader from './components/SentenceHeader'
import ExpenseForm from './components/ExpenseForm'
import DonutCard from './components/DonutCard'
import BarCard from './components/BarCard'
import ListCard from './components/ListCard'
import ExpenseEditModal from './components/ExpenseEditModal'
import UndoToast from './components/UndoToast'

const expenseValidator = (parsed: unknown): Expense[] | null => {
  const result = ExpensesSchema.safeParse(parsed)
  return result.success ? (result.data as Expense[]) : null
}

export default function App() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(
    'receipts_data',
    [],
    expenseValidator
  )
  const [hydrated, setHydrated] = useState(false)
  const [timeframe, setTimeframe] = useState<Timeframe>('this-week')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [recentlyDeleted, setRecentlyDeleted] = useState<Expense | null>(null)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const filtered = useFilteredExpenses(expenses, timeframe)
  const lastWeekTotal = useTotal(useFilteredExpenses(expenses, 'last-week'))

  const handleAdd = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
  }

  const handleUpdate = (updated: Expense) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    )
  }

  const handleDelete = (id: string) => {
    const target = expenses.find((e) => e.id === id)
    if (!target) return

    setExpenses((prev) => prev.filter((e) => e.id !== id))
    setRecentlyDeleted(target)
  }

  const handleUndo = () => {
    if (!recentlyDeleted) return
    setExpenses((prev) => [recentlyDeleted, ...prev])
    setRecentlyDeleted(null)
  }

  const handleToastDismiss = () => {
    setRecentlyDeleted(null)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <p className="text-text-faint">Loading&hellip;</p>
      </div>
    )
  }

  const hasData = expenses.length > 0

  return (
    <>
      <div className="min-h-screen bg-bg-base text-text-primary font-sans">

        <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-md border-b border-bg-border/40">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
            <CornerMark />
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

          <div className="mb-8 md:mb-10">
            <SentenceHeader
              allExpenses={expenses}
              filtered={filtered}
              timeframe={timeframe}
              lastWeekTotal={lastWeekTotal}
              onTimeframeChange={setTimeframe}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="order-2 lg:order-1"><ExpenseForm onAdd={handleAdd} /></div>
            <div className="order-1 lg:order-2"><DonutCard filtered={filtered} allExpenses={expenses} hasData={hasData} /></div>
            <div className="order-3"><ListCard
              filtered={filtered}
              allExpenses={expenses}
              onRowClick={setEditingExpense}
            /></div>
            <div className="order-4"><BarCard filtered={filtered} hasData={hasData} /></div>
          </div>

        </div>
      </div>

      <ExpenseEditModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />

      {recentlyDeleted && (
        <UndoToast
          message="Expense deleted."
          onUndo={handleUndo}
          onDismiss={handleToastDismiss}
        />
      )}
    </>
  )
}
