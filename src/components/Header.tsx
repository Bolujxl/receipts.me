import type { Timeframe } from '../types'
import { formatCents } from '../lib/format'

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'all-time', label: 'All Time' },
]

interface HeaderProps {
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
  total: number
}

export default function Header({ timeframe, onTimeframeChange, total }: HeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo-dark.svg" alt="" className="w-7 h-7" />
          <h1 className="text-text-primary text-sm font-semibold tracking-tight font-sans">receipts.me</h1>
        </div>
        <div className="inline-flex rounded-lg bg-bg-elevated p-1" role="group">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTimeframeChange(t.value)}
              className={`px-3.5 py-1.5 text-sm rounded-md transition-colors ${
                timeframe === t.value
                  ? 'bg-brand/15 text-brand'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-text-muted text-xs tracking-wider uppercase">Weekly Total</p>
        <p className="text-brand text-5xl font-medium font-mono">
          {formatCents(total)}
        </p>
      </div>
    </header>
  )
}
