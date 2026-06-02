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
import type { Expense } from '../types'

const DONUT_COLORS = ['#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a']

interface AnalyticsProps {
  filtered: Expense[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { category, amount } = payload[0].payload
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-zinc-400 capitalize">{category}</p>
      <p className="text-white font-medium tabular-nums">{formatted}</p>
    </div>
  )
}

export default function Analytics({ filtered }: AnalyticsProps) {
  const categoryTotals = useCategoryTotals(filtered)
  const dailyTotals = useDailyTotals(filtered)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-zinc-400 text-xs tracking-wider uppercase mb-4">Spend by Category</h2>
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
                {categoryTotals.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-zinc-400 text-xs tracking-wider uppercase mb-4">Daily Trend (7 Days)</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTotals} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                fill="#d4d4d8"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
