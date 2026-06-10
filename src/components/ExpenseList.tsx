import type { Expense, Timeframe } from '../types'
import { formatCents, formatDate } from '../lib/format'

const CATEGORY_COLORS: Record<string, string> = {
  food: '#9F1239',
  transport: '#1E40AF',
  data: '#5B21B6',
  fun: '#A16207',
  other: '#52525B',
}

interface ExpenseListProps {
  filtered: Expense[]
  timeframe: Timeframe
}

export default function ExpenseList({ filtered }: ExpenseListProps) {
  const sorted = [...filtered].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return 0
  })

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-muted text-xs tracking-wider uppercase">
          Recent Expenses
        </h2>
        <span className="text-text-faint text-xs font-mono">
          {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-text-muted text-sm py-8 text-center">
          Nothing in this timeframe yet.
        </p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto -mr-2 pr-2">
          <ul className="divide-y divide-bg-border">
            {sorted.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center gap-4 py-3"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other }}
                  aria-hidden="true"
                />

                <div className="text-text-secondary text-sm font-mono w-32 flex-shrink-0">
                  {formatDate(expense.date)}
                </div>

                <div className="text-text-muted text-sm capitalize flex-1">
                  {expense.category}
                </div>

                <div className="text-text-primary text-sm font-mono tabular-nums text-right flex-shrink-0">
                  {formatCents(expense.amountCents)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
