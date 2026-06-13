import { useEffect, useState } from 'react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
  duration?: number
}

export default function UndoToast({
  message,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 200)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-4
        bg-bg-elevated border border-bg-border
        rounded-lg shadow-lg
        px-4 py-3
        transition-opacity duration-200
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <span className="text-text-primary text-sm">{message}</span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(onUndo, 200)
        }}
        className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
      >
        Undo
      </button>
    </div>
  )
}
