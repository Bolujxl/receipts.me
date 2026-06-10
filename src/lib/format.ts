export function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00'
  return new Intl.NumberFormat(navigator.language || 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(year, month - 1, day)

  return d.toLocaleDateString(navigator.language || 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
