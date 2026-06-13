import { useState } from 'react'
import type { Category, Expense } from '../types'
import { CATEGORIES } from '../types'
import { validateExpenseInput } from '../lib/format'

interface ExpenseFormProps {
  onAdd: (expense: Expense) => void
  className?: string
}

export default function ExpenseForm({ onAdd, className }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const { amountCents, error: validationError } = validateExpenseInput(amount, date)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      onAdd({
        id: crypto.randomUUID(),
        amountCents,
        category,
        date,
      })
    } catch (err) {
      console.error('Failed to add expense', err)
      setError('Something went wrong. Try again.')
      return
    }

    setAmount('')
    setDate(new Date().toLocaleDateString('en-CA'))
    setError('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-bg-surface border border-bg-border p-6 rounded-xl space-y-4 ${className ?? ''}`}
    >
      <div className="space-y-1.5">
        <label className="text-text-muted text-xs tracking-wider uppercase">Amount</label>
        <div className="relative">
          {/* TODO [Audit 03 §5]: make currency prefix dynamic if multi-currency is added */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-bg-base border border-bg-border rounded-lg py-3 pl-8 pr-4 text-text-primary text-lg placeholder:text-text-faint focus:outline-none focus:border-brand transition-colors font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-text-muted text-xs tracking-wider uppercase">Category</label>
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
        <label className="text-text-muted text-xs tracking-wider uppercase">Date</label>
        <input
          type="date"
          value={date}
          max={new Date().toLocaleDateString('en-CA')}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-bg-base border border-bg-border rounded-lg py-3 px-4 text-text-primary focus:outline-none focus:border-brand transition-colors color-scheme:dark"
        />
      </div>

      {error && (
        <p className="text-status-error text-xs">{error}</p>
      )}

      <button
        type="submit"
        className="w-full bg-brand text-brand-text-on font-medium py-3 rounded-lg hover:bg-brand-hover transition-colors duration-150"
      >
        Add Expense
      </button>
    </form>
  )
}
