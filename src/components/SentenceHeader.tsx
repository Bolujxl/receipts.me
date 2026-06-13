import { useState } from 'react'
import type { Expense, Timeframe, Category } from '../types'
import { formatCents } from '../lib/format'
import { CATEGORY_COLORS } from '../lib/constants'
import TimeframeDropdown from './TimeframeDropdown'

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
  lastWeekTotal: number
  budgets: Record<string, number>
  onTimeframeChange: (t: Timeframe) => void
}

function Amount({ value }: { value: number }) {
  return (
    <span
      key={value}
      className="text-brand font-mono text-4xl md:text-6xl font-medium tracking-tight inline-block animate-[amount-in_300ms_ease-out] motion-reduce:animate-none"
    >
      {formatCents(value)}
    </span>
  )
}

function CategoryLabel({ category }: { category: Category }) {
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

export default function SentenceHeader({
  allExpenses,
  filtered,
  timeframe,
  lastWeekTotal,
  budgets,
  onTimeframeChange,
}: SentenceHeaderProps) {
  const [dropdownAnchor, setDropdownAnchor] = useState<DOMRect | null>(null)

  const state = deriveSentenceState(allExpenses, filtered, timeframe)
  const dropdownOpen = dropdownAnchor !== null

  const handleTimeframeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (dropdownOpen) {
      setDropdownAnchor(null)
    } else {
      setDropdownAnchor(e.currentTarget.getBoundingClientRect())
    }
  }

  const timeframeLabel = timeframe === 'this-week' ? 'week' : TIMEFRAME_LABEL[timeframe]

  let content: React.ReactNode

  if (state.kind === 'no-expenses') {
    content = (
      <>Start tracking &mdash; your first expense unlocks the dashboard.</>
    )
  } else if (state.kind === 'empty-timeframe') {
    if (state.timeframe === 'last-week') {
      content = (
        <>You kept everything{' '}
          <button
            onClick={handleTimeframeClick}
            aria-expanded={dropdownOpen}
            className="font-medium underline decoration-brand decoration-2 underline-offset-4 hover:opacity-90 transition-opacity motion-reduce:transition-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
          >last week</button>{' '}
          &mdash; $0 out.
        </>
      )
    } else if (state.timeframe === 'this-week') {
      content = (
        <>You haven&rsquo;t spent anything this{' '}
          <button
            onClick={handleTimeframeClick}
            aria-expanded={dropdownOpen}
            className="font-medium underline decoration-brand decoration-2 underline-offset-4 hover:opacity-90 transition-opacity motion-reduce:transition-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
          >week</button>{' '}
          yet.
        </>
      )
    } else {
      content = (
        <>Nothing tracked{' '}
          <button
            onClick={handleTimeframeClick}
            aria-expanded={dropdownOpen}
            className="font-medium underline decoration-brand decoration-2 underline-offset-4 hover:opacity-90 transition-opacity motion-reduce:transition-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
          >all time</button>{' '}
          yet.
        </>
      )
    }
  } else if (state.kind === 'single-expense') {
    content = (
      <>
        <Amount value={state.amount} />{' '}
        out {state.timeframe === 'this-week' ? 'this ' : ''}
        <button
          onClick={handleTimeframeClick}
          aria-expanded={dropdownOpen}
          className="font-medium underline decoration-brand decoration-2 underline-offset-4 hover:opacity-90 transition-opacity motion-reduce:transition-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
        >{timeframeLabel}</button>, on <CategoryLabel category={state.category} />.
      </>
    )
  } else if (state.kind === 'tied') {
    content = (
      <>
        <Amount value={state.amount} />{' '}
        out {state.timeframe === 'this-week' ? 'this ' : ''}
        <button
          onClick={handleTimeframeClick}
          aria-expanded={dropdownOpen}
          className="font-medium underline decoration-brand decoration-2 underline-offset-4 hover:opacity-90 transition-opacity motion-reduce:transition-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
        >{timeframeLabel}</button>, spread evenly.
      </>
    )
  } else {
    content = (
      <>
        <Amount value={state.amount} />{' '}
        out {state.timeframe === 'this-week' ? 'this ' : ''}
        <button
          onClick={handleTimeframeClick}
          aria-expanded={dropdownOpen}
          className="font-medium underline decoration-brand decoration-2 underline-offset-4 hover:opacity-90 transition-opacity motion-reduce:transition-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
        >{timeframeLabel}</button>, mostly on <CategoryLabel category={state.category} />.
      </>
    )
  }

  const hasCurrentData = state.kind !== 'no-expenses' && state.kind !== 'empty-timeframe'
  const currentTotal = hasCurrentData ? state.amount : 0
  const showDelta = hasCurrentData && lastWeekTotal > 0

  let deltaNode: React.ReactNode = null
  if (showDelta) {
    const diff = currentTotal - lastWeekTotal
    if (diff === 0) {
      deltaNode = <span className="text-text-muted font-mono text-sm">&mdash; same as last week</span>
    } else if (diff > 0) {
      deltaNode = (
        <span className="text-brand font-mono text-sm">
          &#8593; {formatCents(diff)} from last week
        </span>
      )
    } else {
      deltaNode = (
        <span className="text-status-error font-mono text-sm">
          &#8595; {formatCents(Math.abs(diff))} from last week
        </span>
      )
    }
  }

  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0)
  const budgetPct = totalBudget > 0 ? Math.round((currentTotal / totalBudget) * 100) : 0
  const showBudget = hasCurrentData && totalBudget > 0

  return (
    <>
      <p className="text-text-primary text-2xl md:text-3xl font-sans leading-snug max-w-[800px]">
        {content}
      </p>

      {deltaNode && (
        <p className="mt-1 animate-[fade-in_200ms_ease-out] motion-reduce:animate-none">{deltaNode}</p>
      )}

      {showBudget && (
        <p className="mt-1 animate-[fade-in_200ms_ease-out] motion-reduce:animate-none">
          <span className={`font-mono text-sm ${budgetPct >= 100 ? 'text-status-error' : 'text-text-muted'}`}>
            {budgetPct}% of monthly budget
          </span>
        </p>
      )}

      <TimeframeDropdown
        current={timeframe}
        onSelect={onTimeframeChange}
        onClose={() => setDropdownAnchor(null)}
        anchorRect={dropdownAnchor}
      />
    </>
  )
}
