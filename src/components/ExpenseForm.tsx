import { useState } from 'react'
import type { Category, Expense } from '../types'
import { CATEGORIES } from '../types'

interface ExpenseFormProps {
  onAdd: (expense: Expense) => void
}

const todayISO = new Date().toISOString().split('T')[0]

export default function ExpenseForm({ onAdd }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [date, setDate] = useState(todayISO)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a positive amount.')
      return
    }

    if (date > todayISO) {
      setError('Future dates are not allowed.')
      return
    }

    onAdd({
      id: crypto.randomUUID(),
      amount: parsed,
      category,
      date,
    })

    setAmount('')
    setCategory('food')
    setDate(todayISO)
    setError('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs tracking-wider uppercase">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-8 pr-4 text-white text-lg placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs tracking-wider uppercase">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-zinc-600 transition-colors appearance-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-zinc-900">
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs tracking-wider uppercase">Date</label>
        <input
          type="date"
          value={date}
          max={todayISO}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-zinc-600 transition-colors color-scheme:dark"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <button
        type="submit"
        className="w-full bg-white text-black font-medium py-3 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        Add Expense
      </button>
    </form>
  )
}
