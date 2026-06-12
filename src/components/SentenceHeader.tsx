import { useState } from 'react'
import type { Expense, Timeframe, Category } from '../types'
import { formatCents } from '../lib/format'
import TimeframeDropdown from './TimeframeDropdown'

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

const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  'this-week': 'week',
  'last-week': 'last week',
  'all-time': 'all time',
}

type SentenceState =
  | { kind: 'no-expenses' }
  | { kind: 'empty-timeframe'; timeframe: Timeframe }
  | { kind: 'single-expense'; amount: number; timeframe: Timeframe; category: Category }
  | { kind: 'tied'; amount: number; timeframe: Timeframe }
  | { kind: 'default'; amount: number; timeframe: Timeframe; category: Category }

function deriveSentenceState(
  allExpenses: Expense[],
  filtered: Expense[],
  timeframe: Timeframe
): SentenceState {
  if (allExpenses.length === 0) return { kind: 'no-expenses' }
  if (filtered.length === 0) return { kind: 'empty-timeframe', timeframe }

  const total = filtered.reduce((sum, e) => sum + e.amountCents, 0)

  if (filtered.length === 1) {
    return {
      kind: 'single-expense',
      amount: total,
      timeframe,
      category: filtered[0].category,
    }
  }

  const byCategory: Record<string, number> = {}
  for (const e of filtered) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amountCents
  }
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  const second = sorted[1]

  if (second && top[1] - second[1] < top[1] * 0.05) {
    return { kind: 'tied', amount: total, timeframe }
  }

  return {
    kind: 'default',
    amount: total,
    timeframe,
    category: top[0] as Category,
  }
}

interface SentenceHeaderProps {
  allExpenses: Expense[]
  filtered: Expense[]
  timeframe: Timeframe
  onTimeframeChange: (t: Timeframe) => void
}

function Amount({ value }: { value: number }) {
  return (
    <span className="text-brand font-mono text-4xl md:text-6xl font-medium tracking-tight">
      {formatCents(value)}
    </span>
  )
}

export default function SentenceHeader({
  allExpenses,
  filtered,
  timeframe,
  onTimeframeChange,
}: SentenceHeaderProps) {
  const [dropdownAnchor, setDropdownAnchor] = useState<DOMRect | null>(null)

  const state = deriveSentenceState(allExpenses, filtered, timeframe)

  const handleTimeframeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setDropdownAnchor(e.currentTarget.getBoundingClientRect())
  }

  const TimeframeWord = ({ timeframe }: { timeframe: Timeframe }) => (
    <button
      onClick={handleTimeframeClick}
      className="font-medium underline decoration-brand decoration-2 underline-offset-4 hover:opacity-90 transition-opacity motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
    >
      {timeframe === 'this-week' ? 'week' : TIMEFRAME_LABEL[timeframe]}
    </button>
  )

  const CategoryWord = ({ category }: { category: Category }) => {
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
    return (
      <span
        className="font-medium underline decoration-2 underline-offset-4"
        style={{ color, textDecorationColor: color }}
      >
        {category}
      </span>
    )
  }

  let content: React.ReactNode

  if (state.kind === 'no-expenses') {
    content = (
      <>Start tracking &mdash; your first expense unlocks the dashboard.</>
    )
  } else if (state.kind === 'empty-timeframe') {
    if (state.timeframe === 'last-week') {
      content = <>You kept everything <TimeframeWord timeframe="last-week" /> &mdash; $0 out.</>
    } else if (state.timeframe === 'this-week') {
      content = <>You haven&rsquo;t spent anything this <TimeframeWord timeframe="this-week" /> yet.</>
    } else {
      content = <>Nothing tracked <TimeframeWord timeframe="all-time" /> yet.</>
    }
  } else if (state.kind === 'single-expense') {
    content = (
      <>
        <Amount value={state.amount} />{' '}
        out {state.timeframe === 'this-week' ? 'this ' : ''}
        <TimeframeWord timeframe={state.timeframe} />, on <CategoryWord category={state.category} />.
      </>
    )
  } else if (state.kind === 'tied') {
    content = (
      <>
        <Amount value={state.amount} />{' '}
        out {state.timeframe === 'this-week' ? 'this ' : ''}
        <TimeframeWord timeframe={state.timeframe} />, spread evenly.
      </>
    )
  } else {
    content = (
      <>
        <Amount value={state.amount} />{' '}
        out {state.timeframe === 'this-week' ? 'this ' : ''}
        <TimeframeWord timeframe={state.timeframe} />, mostly on <CategoryWord category={state.category} />.
      </>
    )
  }

  return (
    <>
      <p className="text-text-primary text-2xl md:text-3xl font-sans leading-snug max-w-[800px]">
        {content}
      </p>

      <TimeframeDropdown
        current={timeframe}
        onSelect={onTimeframeChange}
        onClose={() => setDropdownAnchor(null)}
        anchorRect={dropdownAnchor}
      />
    </>
  )
}
