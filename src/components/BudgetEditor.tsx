import { useState } from 'react'
import { CATEGORIES } from '../types'
import { CATEGORY_COLORS } from '../lib/constants'

interface BudgetEditorProps {
  budgets: Record<string, number>
  onSave: (budgets: Record<string, number>) => void
  onClose: () => void
}

export default function BudgetEditor({ budgets, onSave, onClose }: BudgetEditorProps) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const cat of CATEGORIES) {
      const cents = budgets[cat] || 0
      initial[cat] = cents > 0 ? (cents / 100).toFixed(2) : ''
    }
    return initial
  })

  const handleSave = () => {
    const next: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      const parsed = parseFloat(draft[cat])
      next[cat] = isNaN(parsed) || parsed <= 0 ? 0 : Math.round(parsed * 100)
    }
    onSave(next)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-editor-title"
    >
      <div
        className="bg-bg-surface border border-bg-border rounded-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="budget-editor-title" className="text-text-primary text-base font-medium">
            Monthly Budgets
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {CATEGORIES.map((cat) => {
            const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
            return (
              <div key={cat} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="text-text-muted text-sm capitalize w-24">
                  {cat}
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={draft[cat]}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [cat]: e.target.value.replace(/[^0-9.]/g, '') }))}
                    className="w-full bg-bg-base border border-bg-border rounded-lg py-2 pl-7 pr-3 text-text-primary text-sm font-mono placeholder:text-text-faint focus:outline-none focus:border-brand transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-5 py-2.5 bg-brand hover:bg-brand-hover text-brand-text-on rounded-lg transition-colors text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
