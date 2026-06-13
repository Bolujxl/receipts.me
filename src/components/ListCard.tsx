import { useState } from 'react'
import type { Expense } from '../types'
import { CATEGORIES } from '../types'
import { formatCents, formatDate } from '../lib/format'
import { CATEGORY_COLORS } from '../lib/constants'

interface ListCardProps {
  filtered: Expense[]
  allExpenses: Expense[]
  onRowClick: (expense: Expense) => void
  className?: string
}

export default function ListCard({ filtered, allExpenses, onRowClick, className }: ListCardProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const sorted = [...filtered].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return 0
  })

  const displayed = activeCategory
    ? sorted.filter((e) => e.category === activeCategory)
    : sorted

  const hasAnyData = allExpenses.length > 0

  return (
    <div className={`bg-bg-surface border border-bg-border rounded-xl p-6 flex flex-col min-h-[300px] ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-text-muted text-xs tracking-wider uppercase">
          Recent Expenses
        </h2>
        {hasAnyData && (
          <span className="text-text-faint text-xs font-mono">
            {displayed.length} {displayed.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {hasAnyData && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CATEGORIES.map((cat) => {
            const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
            const isActive = activeCategory === cat
            const count = sorted.filter((e) => e.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all active:scale-[0.96] ${
                  isActive ? 'opacity-100 bg-bg-elevated' : 'opacity-40 hover:opacity-70'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className={isActive ? 'text-text-primary' : 'text-text-muted'}>
                  {cat}
                </span>
                {count > 0 && (
                  <span className={`font-mono ${isActive ? 'text-text-faint' : 'text-text-faint/60'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex-1 min-h-0">
        {!hasAnyData ? (
          <p className="text-text-faint text-sm py-8 text-center">
            Add your first expense to see it here.
          </p>
        ) : displayed.length === 0 ? (
          <p className="text-text-faint text-sm py-8 text-center">
            No {activeCategory} expenses in this timeframe.
          </p>
        ) : (
          <div className="h-full max-h-[260px] overflow-y-auto -mr-2 pr-2">
            <ul className="divide-y divide-bg-border">
              {displayed.map((expense) => (
                <li key={expense.id}>
                  <button
                    onClick={() => onRowClick(expense)}
                    aria-label={`Edit ${formatCents(expense.amountCents)} ${expense.category} expense from ${formatDate(expense.date)}`}
                    className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-bg-elevated/40 rounded-lg px-2 -mx-2 transition-colors motion-reduce:transition-none"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other }}
                      aria-hidden="true"
                    />
                    <div className="text-text-secondary text-sm font-mono w-28 flex-shrink-0">
                      {formatDate(expense.date)}
                    </div>
                    <div className="text-text-muted text-sm capitalize flex-1 truncate">
                      {expense.category}
                    </div>
                    <div className="text-text-primary text-sm font-mono flex-shrink-0">
                      {formatCents(expense.amountCents)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
