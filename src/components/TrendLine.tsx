import { useWeeklyTrend } from '../analytics'
import { formatCents } from '../lib/format'
import type { Expense } from '../types'

interface TrendLineProps {
  expenses: Expense[]
}

export default function TrendLine({ expenses }: TrendLineProps) {
  const weeks = useWeeklyTrend(expenses)

  const max = Math.max(...weeks.map((w) => w.amount), 1)

  return (
    <div className="flex items-end gap-2 h-12 mt-2">
      {weeks.map((week) => {
        const height = Math.max((week.amount / max) * 100, 2)
        return (
          <div key={week.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-text-faint font-mono text-[10px] leading-none tabular-nums">
              {week.amount > 0 ? formatCents(week.amount) : ''}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-sm bg-brand/60 min-h-[2px] transition-all duration-300"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-text-faint text-[10px] leading-none truncate w-full text-center">
              {week.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
