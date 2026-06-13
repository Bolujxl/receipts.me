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
import TrendLine from './components/TrendLine'
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
  const [budgets, setBudgets] = useLocalStorage<Record<string, number>>('receipts_budgets', {})

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

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipts-me-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        const validated = expenseValidator(parsed)
        if (validated) {
          setExpenses(validated)
        }
      } catch {
        // invalid file
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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

        <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-md border-b border-bg-border/40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <CornerMark />
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="text-text-faint hover:text-text-muted text-xs transition-colors"
                title="Export expenses"
              >
                Export
              </button>
              <label className="text-text-faint hover:text-text-muted text-xs transition-colors cursor-pointer" title="Import expenses">
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

          <div className="mb-8 md:mb-10">
            <SentenceHeader
              allExpenses={expenses}
              filtered={filtered}
              timeframe={timeframe}
              lastWeekTotal={lastWeekTotal}
              budgets={budgets}
              onTimeframeChange={setTimeframe}
            />

            {hasData && <TrendLine expenses={expenses} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseForm onAdd={handleAdd} className="order-2 lg:order-1" />
            <DonutCard filtered={filtered} allExpenses={expenses} budgets={budgets} onBudgetsChange={setBudgets} hasData={hasData} className="order-1 lg:order-2" />
            <ListCard
              filtered={filtered}
              allExpenses={expenses}
              onRowClick={setEditingExpense}
              className="order-3"
            />
            <BarCard filtered={filtered} hasData={hasData} className="order-4" />
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
