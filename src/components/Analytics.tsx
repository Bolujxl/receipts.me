import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'
import { useCategoryTotals, useDailyTotals } from '../analytics'
import { formatCents } from '../lib/format'
import type { Expense } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  food: '#9F1239',
  transport: '#1E40AF',
  data: '#5B21B6',
  fun: '#A16207',
  other: '#52525B',
}

const AXIS_COLOR = '#A1A1AA'

interface AnalyticsProps {
  filtered: Expense[]
}

function CustomTooltip({ active, payload, labelKey }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const label = data[labelKey] ?? ''
  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-text-muted capitalize">{label}</p>
      <p className="text-text-primary font-medium font-mono">{formatCents(data.amount)}</p>
    </div>
  )
}

export default function Analytics({ filtered }: AnalyticsProps) {
  const categoryTotals = useCategoryTotals(filtered)
  const dailyTotals = useDailyTotals(filtered)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-text-muted text-xs tracking-wider uppercase mb-4">Spend by Category</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
                  <Cell key={i} fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip labelKey="category" />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-text-muted text-xs tracking-wider uppercase mb-4">Daily Trend (7 Days)</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTotals} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                tickFormatter={(v) => formatCents(v)}
              />
              <Tooltip content={<CustomTooltip labelKey="day" />} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {dailyTotals.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.amount === 0
                        ? '#27272A'
                        : (CATEGORY_COLORS[entry.dominantCategory] || CATEGORY_COLORS.other)
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
