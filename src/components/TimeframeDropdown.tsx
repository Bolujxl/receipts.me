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
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (!menuRef.current) return

      const items = menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
      const currentIndex = Array.from(items).findIndex((el) => el === document.activeElement)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (currentIndex + 1) % items.length
        items[next]?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (currentIndex - 1 + items.length) % items.length
        items[prev]?.focus()
      } else if (e.key === 'Home') {
        e.preventDefault()
        items[0]?.focus()
      } else if (e.key === 'End') {
        e.preventDefault()
        items[items.length - 1]?.focus()
      }
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
      className="bg-bg-elevated border border-bg-border rounded-lg shadow-xl py-1.5 min-w-[160px] animate-[slide-in_150ms_ease-out] motion-reduce:animate-none"
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
              w-full flex items-center justify-between gap-3 px-3 py-2 text-sm transition-all active:scale-[0.98]
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
