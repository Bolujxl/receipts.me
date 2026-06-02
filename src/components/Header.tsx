import type { Timeframe } from '../types'

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
        <h1 className="text-white text-lg font-medium tracking-tight">Receipts</h1>
        <div className="inline-flex rounded-lg bg-zinc-900 p-1" role="group">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTimeframeChange(t.value)}
              className={`px-3.5 py-1.5 text-sm rounded-md transition-colors ${
                timeframe === t.value
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-zinc-400 text-xs tracking-wider uppercase">Weekly Total</p>
        <p className="text-white text-4xl font-semibold tracking-tight tabular-nums">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </header>
  )
}
