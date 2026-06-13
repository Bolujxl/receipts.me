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

export function validateExpenseInput(amount: string, date: string): { amountCents: number; error?: string } {
  const todayISO = new Date().toLocaleDateString('en-CA')

  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed <= 0) {
    return { amountCents: 0, error: 'Enter a positive amount.' }
  }
  if (date > todayISO) {
    return { amountCents: 0, error: 'Future dates are not allowed.' }
  }

  return { amountCents: Math.round(parsed * 100) }
}
