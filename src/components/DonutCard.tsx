import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useCategoryTotals, useLastWeekCategoryTotals } from '../analytics'
import { formatCents } from '../lib/format'
import { CATEGORY_COLORS } from '../lib/constants'
import type { Expense } from '../types'

interface DonutCardProps {
  filtered: Expense[]
  allExpenses: Expense[]
  hasData: boolean
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

export default function DonutCard({ filtered, allExpenses, hasData }: DonutCardProps) {
  const categoryTotals = useCategoryTotals(filtered)
  const lastWeekTotals = useLastWeekCategoryTotals(allExpenses)

  const lastWeekHasData = lastWeekTotals.length > 0 && lastWeekTotals.some((d) => d.amount > 0)

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-6 flex flex-col">
      <h2 className="text-text-muted text-xs tracking-wider uppercase mb-4">
        Spend by Category
      </h2>

      <div className="flex-1 min-h-[240px] flex items-center justify-center">
        {!hasData ? (
          <p className="text-text-faint text-sm">Add your first expense to see the breakdown.</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-faint text-sm">No expenses in this timeframe.</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}
