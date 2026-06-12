import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useDailyTotals } from '../analytics'
import { formatCents } from '../lib/format'
import type { Expense } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  food: '#9F1239',
  transport: '#1E40AF',
  housing: '#0F766E',
  bills: '#475569',
  health: '#047857',
  shopping: '#9D174D',
  fun: '#A16207',
  data: '#5B21B6',
  other: '#52525B',
}

interface BarCardProps {
  filtered: Expense[]
  hasData: boolean
}

function DayTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { day, amount } = payload[0].payload
  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-text-muted">{day}</p>
      <p className="text-text-primary font-mono">{formatCents(amount)}</p>
    </div>
  )
}

export default function BarCard({ filtered, hasData }: BarCardProps) {
  const dailyTotals = useDailyTotals(filtered)

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-6 flex flex-col">
      <h2 className="text-text-muted text-xs tracking-wider uppercase mb-4">
        Daily Trend (7 Days)
      </h2>

      <div className="flex-1 min-h-[240px] flex items-center justify-center">
        {!hasData ? (
          <p className="text-text-faint text-sm">Add an expense to see the trend.</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-faint text-sm">No expenses in this timeframe.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyTotals}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 11 }}
                tickFormatter={(v: number) => formatCents(v)}
                width={70}
              />
              <Tooltip content={<DayTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {dailyTotals.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.amount === 0
                        ? '#27272A'
                        : CATEGORY_COLORS[entry.dominantCategory] || CATEGORY_COLORS.other
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
