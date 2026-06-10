export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-full bg-bg-surface border border-bg-border flex items-center justify-center mb-4">
        <span className="text-text-faint text-2xl">&#8709;</span>
      </div>
      <h2 className="text-text-primary text-base font-medium mb-1">No expenses yet</h2>
      <p className="text-text-muted text-sm max-w-xs">
        Add your first expense to see your spending take shape.
      </p>
    </div>
  )
}
