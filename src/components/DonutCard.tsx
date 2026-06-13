import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useCategoryTotals, useLastWeekCategoryTotals } from '../analytics'
import { formatCents } from '../lib/format'
import { CATEGORY_COLORS } from '../lib/constants'
import { CATEGORIES } from '../types'
import type { Expense } from '../types'
import BudgetEditor from './BudgetEditor'

interface DonutCardProps {
  filtered: Expense[]
  allExpenses: Expense[]
  budgets: Record<string, number>
  onBudgetsChange: (budgets: Record<string, number>) => void
  hasData: boolean
  className?: string
}

function CategoryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { category, amount } = payload[0].payload
  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-text-muted capitalize">{category}</p>
      <p className="text-text-primary font-mono">{formatCents(amount)}</p>
    </div>
  )
}

export default function DonutCard({ filtered, allExpenses, budgets, onBudgetsChange, hasData, className }: DonutCardProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [clickedIndex, setClickedIndex] = useState<number | null>(null)
  const categoryTotals = useCategoryTotals(filtered)
  const lastWeekTotals = useLastWeekCategoryTotals(allExpenses)

  const lastWeekHasData = lastWeekTotals.length > 0 && lastWeekTotals.some((d) => d.amount > 0)

  const hasBudgets = Object.values(budgets).some((v) => v > 0)
  const budgetData = hasBudgets
    ? CATEGORIES.map((cat) => ({ category: cat, amount: budgets[cat] || 0 })).filter((d) => d.amount > 0)
    : []

  const clicked = clickedIndex !== null ? categoryTotals[clickedIndex] : null

  return (
    <>
      <div className={`bg-bg-surface border border-bg-border rounded-xl p-6 flex flex-col ${className ?? ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-muted text-xs tracking-wider uppercase">
            Spend by Category
          </h2>
          <button
            onClick={() => setEditorOpen(true)}
            className="text-text-faint hover:text-text-muted transition-colors"
            aria-label="Edit budgets"
            title="Edit budgets"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="3" />
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.76 2.76l1.42 1.42M9.82 9.82l1.42 1.42M2.76 11.24l1.42-1.42M9.82 4.18l1.42-1.42" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-[240px] flex items-center justify-center">
          {!hasData ? (
            <p className="text-text-faint text-sm">Add your first expense to see the breakdown.</p>
          ) : filtered.length === 0 ? (
            <p className="text-text-faint text-sm">No expenses in this timeframe.</p>
          ) : (
            <div className="relative w-full h-full" onClick={(e) => { if (e.target === e.currentTarget) setClickedIndex(null) }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {lastWeekHasData && (
                  <Pie
                    data={lastWeekTotals}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {lastWeekTotals.map((entry, i) => (
                      <Cell
                        key={`last-${i}`}
                        fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}
                        opacity={0.2}
                      />
                    ))}
                  </Pie>
                )}
                {hasBudgets && (
                  <Pie
                    data={budgetData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={103}
                    outerRadius={112}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {budgetData.map((entry, i) => (
                      <Cell
                        key={`budget-${i}`}
                        fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}
                        opacity={0.25}
                      />
                    ))}
                  </Pie>
                )}
                <Pie
                  data={categoryTotals}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="none"
                  onClick={(_, index) => {
                    setClickedIndex(clickedIndex === index ? null : index)
                  }}
                  className="cursor-pointer"
                >
                  {categoryTotals.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CategoryTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {clicked && (
              <div className="absolute top-2 right-2 z-10 bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm shadow-lg pointer-events-none">
                <p className="text-text-muted capitalize">{clicked.category}</p>
                <p className="text-text-primary font-mono">{formatCents(clicked.amount)}</p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {editorOpen && (
        <BudgetEditor
          budgets={budgets}
          onSave={onBudgetsChange}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  )
}
