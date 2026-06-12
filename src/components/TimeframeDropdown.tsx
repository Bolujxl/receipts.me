import { useEffect, useRef } from 'react'
import type { Timeframe } from '../types'

interface TimeframeDropdownProps {
  current: Timeframe
  onSelect: (t: Timeframe) => void
  onClose: () => void
  anchorRect: DOMRect | null
}

const OPTIONS: { value: Timeframe; label: string }[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'all-time', label: 'All Time' },
]

export default function TimeframeDropdown({
  current,
  onSelect,
  onClose,
  anchorRect,
}: TimeframeDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  if (!anchorRect) return null

  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect.bottom + 8,
    left: anchorRect.left,
    zIndex: 60,
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      style={style}
      className="bg-bg-elevated border border-bg-border rounded-lg shadow-xl py-1.5 min-w-[160px]"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === current
        return (
          <button
            key={option.value}
            role="menuitem"
            onClick={() => {
              onSelect(option.value)
              onClose()
            }}
            className={`
              w-full flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors
              ${isActive
                ? 'bg-brand/15 text-brand font-medium'
                : 'text-text-secondary hover:bg-bg-surface'
              }
            `}
          >
            <span>{option.label}</span>
            {isActive && (
              <span className="text-brand text-xs" aria-hidden="true">&#10003;</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
