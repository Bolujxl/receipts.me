import { useState, useEffect } from 'react'
import type { Category, Expense } from '../types'
import { CATEGORIES } from '../types'
import { validateExpenseInput } from '../lib/format'

interface ExpenseEditModalProps {
  expense: Expense | null
  onClose: () => void
  onSave: (updated: Expense) => void
  onDelete: (id: string) => void
}

export default function ExpenseEditModal({
  expense,
  onClose,
  onSave,
  onDelete,
}: ExpenseEditModalProps) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [error, setError] = useState('')

  useEffect(() => {
    if (expense) {
      setAmount((expense.amountCents / 100).toFixed(2))
      setCategory(expense.category)
      setDate(expense.date)
      setError('')
    }
  }, [expense])

  useEffect(() => {
    if (!expense) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [expense, onClose])

  const open = expense !== null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const { amountCents, error: validationError } = validateExpenseInput(amount, date)
    if (validationError) {
      setError(validationError)
      return
    }

    const updated: Expense = {
      id: expense!.id,
      amountCents,
      category,
      date,
    }
    onSave(updated)
    onClose()
  }

  const handleDelete = () => {
    onDelete(expense!.id)
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 motion-reduce:transition-none ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`bg-bg-surface border border-bg-border rounded-xl p-6 w-full max-w-md relative transition-all duration-200 motion-reduce:transition-none ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="edit-modal-title" className="text-text-primary text-base font-medium">
            Edit Expense
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-text-muted text-xs tracking-wider uppercase">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                autoFocus
                className="w-full bg-bg-base border border-bg-border rounded-lg py-3 pl-8 pr-4 text-text-primary text-lg font-mono placeholder:text-text-faint focus:outline-none focus:border-brand transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-muted text-xs tracking-wider uppercase">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-bg-base border border-bg-border rounded-lg py-3 px-4 text-text-primary focus:outline-none focus:border-brand transition-colors appearance-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-bg-base">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-text-muted text-xs tracking-wider uppercase">
              Date
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-base border border-bg-border rounded-lg py-3 px-4 text-text-primary font-mono focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {error && (
            <p className="text-status-error text-xs">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 text-status-error hover:bg-status-error/10 rounded-lg transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-brand-text-on rounded-lg transition-colors text-sm font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
