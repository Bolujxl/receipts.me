import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useDailyTotals } from '../analytics'
import { formatCents } from '../lib/format'
import type { Expense } from '../types'

interface BarCardProps {
  filtered: Expense[]
  hasData: boolean
  className?: string
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

export default function BarCard({ filtered, hasData, className }: BarCardProps) {
  const [clickedIndex, setClickedIndex] = useState<number | null>(null)
  const dailyTotals = useDailyTotals(filtered)

  const average = dailyTotals.length > 0
    ? dailyTotals.reduce((sum, d) => sum + d.amount, 0) / dailyTotals.length
    : 0

  const clicked = clickedIndex !== null ? dailyTotals[clickedIndex] : null

  return (
    <div className={`bg-bg-surface border border-bg-border rounded-xl p-6 flex flex-col cursor-pointer ${className ?? ''}`}>
      <h2 className="text-text-muted text-xs tracking-wider uppercase mb-4">
        Daily Trend (7 Days)
      </h2>

      <div className="flex-1 min-h-[240px] flex items-center justify-center relative">
        {!hasData ? (
          <p className="text-text-faint text-sm">Add your first expense to see the trend.</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-faint text-sm">No expenses in this timeframe.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyTotals}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                onClick={(data: any) => {
                  const idx = data?.activeTooltipIndex
                  if (idx == null) {
                    setClickedIndex(null)
                    return
                  }
                  setClickedIndex(clickedIndex === idx ? null : idx)
                }}
              >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgb(var(--text-faint))', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgb(var(--text-faint))', fontSize: 11 }}
                    tickFormatter={(v: number) => formatCents(v)}
                    width={70}
                  />
              <Tooltip content={<DayTooltip />} cursor={{ fill: 'rgb(var(--text-primary) / 0.04)' }} />
              <ReferenceLine
                y={average}
                stroke="rgb(var(--text-muted))"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    fill="#7C9F3F"
                  />
                </BarChart>
              </ResponsiveContainer>
            {clicked && (
              <div className="absolute top-2 right-2 z-10 bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm shadow-lg pointer-events-none">
                <p className="text-text-muted">{clicked.day}</p>
                <p className="text-text-primary font-mono">{formatCents(clicked.amount)}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
