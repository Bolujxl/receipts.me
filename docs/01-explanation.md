# How It Works: The Journey of a Receipt

## 1. The Starting Line: Making the Data

Imagine you have a magic notebook. Every time you spend money on something — lunch, a bus ride, rent — you scribble it down on a sticky note and slap it onto the notebook's cover. That sticky note is an *Expense*. And the notebook? That's React's state — a living list that remembers everything you've ever written, even if you close the app and come back tomorrow.

But before the sticky note reaches the notebook, it has to pass through a little robot called the **Form**. The form is a strict quality inspector. It won't let a bad sticky note through. Let's watch the inspector do its job, line by line.

### Line-by-Line Breakdown: The `handleSubmit` Journey

Everything starts in `src/components/ExpenseForm.tsx:17` — the `handleSubmit` function.

```ts
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
```

When you click the "Add Expense" button, the browser's default instinct is to reload the page. `e.preventDefault()` tells the browser, "Stop right there — *I'm* driving."

But instead of writing validation from scratch, the form calls a shared helper:

```ts
  const { amountCents, error: validationError } = validateExpenseInput(amount, date)
  if (validationError) {
    setError(validationError)
    return
  }
```

This calls `validateExpenseInput` from `src/lib/format.ts`. It's a shared function used by *both* forms (Add + Edit) so there's only one place to fix bugs. Inside it:

```ts
const todayISO = new Date().toLocaleDateString('en-CA')  // "2026-06-13" in local time
const parsed = parseFloat(amount)
if (isNaN(parsed) || parsed <= 0) return { error: 'Enter a positive amount.' }
if (date > todayISO) return { error: 'Future dates are not allowed.' }
return { amountCents: Math.round(parsed * 100) }
```

Notice two clever things here:

1. **`toLocaleDateString('en-CA')`** — the Canadian English locale formats dates as YYYY-MM-DD. Unlike `toISOString()` which uses UTC, this gives the date in *your* timezone. If you add an expense at 11 PM, it shows today, not tomorrow. (The old code had this bug — fixed in a later audit.)

2. **`Math.round(parsed * 100)`** — this converts dollars to integer cents. If you type `19.99`, it becomes `1999`. The `Math.round` is critical because `19.99 * 100` equals `1998.9999999999998` in binary floating-point. Without the round, you'd lose a penny. *With* the round, it lands on exactly `1999`.

This is the birth of the `amountCents` paradigm: store money as integers, never as floating-point. Every arithmetic operation in the entire app works on whole numbers. The only time we divide by 100 is at the very end — when displaying to a human.

Now the inspector stamps the sticky note:

```ts
  onAdd({
    id: crypto.randomUUID(),
    amountCents,
    category,
    date,
  })
```

The `Expense` shape lives in `src/types.ts:12-17`:

```ts
export interface Expense {
  id: string
  amountCents: number    // integer, e.g. 1999 = $19.99
  category: Category     // one of 9 strings
  date: string           // "2026-06-13"
}
```

The `Category` type isn't 5 options anymore — it's 9:

```ts
export type Category =
  | 'food' | 'transport' | 'housing' | 'bills'
  | 'health' | 'shopping' | 'fun' | 'data' | 'other'
```

After stamping, the inspector tidies up its desk:

```ts
  setAmount('')
  setDate(new Date().toLocaleDateString('en-CA'))
  setError('')
}
```

The amount clears. The date resets to today. But notice what's *missing*: `setCategory('food')`. The category stays on whatever you last picked. If you're batch-entering 5 transport expenses, you no longer have to re-select "transport" every time. This was a quality-of-life fix from the code review.

### Where Does the Note Actually Go?

The `onAdd` prop is wired up in `src/App.tsx`:

```tsx
<ExpenseForm onAdd={handleAdd} />
```

And `handleAdd` is:

```ts
const handleAdd = (expense: Expense) => {
  setExpenses((prev) => [expense, ...prev])
}
```

This is the moment the sticky note hits the notebook. `setExpenses` puts the new expense at the front of the array. `...prev` spreads the existing notes after it — an **immutable update**. We never modify the old array; we create a brand new one with the new note prepended. React compares references to know when to re-render.

### The Vault: How `useLocalStorage` Works

The data survives page refreshes. The magic is in `src/useLocalStorage.ts`:

```ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (parsed: unknown) => T | null
) {
```

It now takes an optional third argument: a `validator`. This was one of the biggest audit fixes. Here's how the read path works:

```ts
const [value, setValue] = useState<T>(() => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return initialValue
    const parsed: unknown = JSON.parse(stored)
    if (validator) {
      const validated = validator(parsed)
      if (validated === null) {
        console.warn(`useLocalStorage: validation failed for key "${key}", using initial value`)
        return initialValue
      }
      return validated
    }
    return parsed as T
  } catch {
    return initialValue
  }
})
```

When the app mounts, it reads `localStorage('receipts_data')`. If the data exists, it passes through a **zod validator** defined in `src/lib/validation.ts`:

```ts
export const ExpenseSchema = z.object({
  id: z.string().min(1),
  amountCents: z.number().int().positive().finite(),
  category: z.enum(['food', 'transport', 'housing', 'bills', 'health', 'shopping', 'fun', 'data', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
```

If someone tampered with localStorage via DevTools and wrote `"foood"` as a category, or removed the `amountCents` field, the validator rejects the entire array. The app falls back to an empty array and logs a warning. No crash, no broken charts, no weird donut slices labeled "foood." This was the fix for two audit findings at once — the type-unsafe hydration and the category typo vulnerability.

The write path is simpler:

```ts
useEffect(() => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // TODO: surface storage-unavailable state to UI
  }
}, [key, value])
```

Every time `value` changes, the array is frozen into a string and stashed in the browser's storage closet. If the closet is full or blocked (private mode), the catch block silently swallows the error — the app keeps working in memory, it just won't persist.

---

## 2. The Magic Glasses: Filtering the Truth

Now you've got a drawer full of sticky notes — receipts from today, last month, maybe last year. You pull out a pair of **Magic Glasses**.

Red glasses: you see only this week. Blue glasses: last week. Clear glasses: everything. But the drawer itself never changes. The glasses don't rip up or scribble out the other notes. They just hide them from view.

This is what `.filter()` does. It creates a *copy* of the array with only the matching items. Non-destructive, non-mutative.

### How the Glasses Get Chosen: The Sentence Header

The timeframe picker doesn't live in a clunky segmented control anymore. It lives *inside* the sentence:

> **$785.00** out this **week**, mostly on **transport**.

The word "week" is a button. Click it, and a floating dropdown appears directly below with three options: This Week, Last Week, All Time. This is the `TimeframeDropdown` component (`src/components/TimeframeDropdown.tsx`) — a hand-rolled menu with keyboard navigation (Arrow keys, Home, End, Escape).

The dropdown is rendered with `position: fixed` anchored to the button's `DOMRect`. When you click an option, `onTimeframeChange` fires, which calls `setTimeframe(t.value)` in App.tsx. The sentence re-renders with the new timeframe word and recalculated amounts.

### The Lens Itself: `filterByTimeframe`

It lives in `src/analytics.ts:20-44` and is a **pure function** — same input always gives same output, no side effects, no global state:

```ts
export function filterByTimeframe(expenses: Expense[], timeframe: Timeframe): Expense[] {
  const now = new Date()
  const thisMonday = startOfWeek(now)
  const thisSunday = endOfWeek(now)
```

`startOfWeek` and `endOfWeek` (`analytics.ts:4-18`) calculate Monday at 00:00:00.000 and Sunday at 23:59:59.999 of the current week. `getDay()` returns 0 for Sunday, 1 for Monday, etc. The formula shifts backward to Monday, then the end adds 6 days for Sunday.

```ts
  case 'this-week':
    return expenses.filter((e) => {
      const d = new Date(e.date)
      return d >= thisMonday && d <= thisSunday
    })
```

`.filter()` walks through every expense. For each one: does its date fall inside the Monday-to-Sunday window? If yes, it goes into a brand-new array. If no, skipped. The original `expenses` array is untouched.

```ts
  case 'all-time':
    return expenses
```

The clear glasses. Returns the original reference — no copy, no mutation. Just passes through.

### Wrapping it in `useMemo`

```ts
export function useFilteredExpenses(expenses: Expense[], timeframe: Timeframe) {
  return useMemo(() => filterByTimeframe(expenses, timeframe), [expenses, timeframe])
}
```

`useMemo` says: "Only re-run `filterByTimeframe` if `expenses` or `timeframe` actually changed." Without it, every render would recreate all those `new Date()` objects for every expense. With `useMemo`, it hands back the same result instantly unless the inputs are new.

---

## 3. Feeding the Robot: How the Charts Eat Data

You've got your filtered sticky notes. Now you want to show them off. But Recharts is a **picky robot**. It only eats food in very specific shapes:

- **Donut:** `[{category: 'food', amount: 5000}, {category: 'transport', amount: 2500}, ...]`
- **Bar Chart:** `[{day: 'Mon', amount: 4200}, {day: 'Tue', amount: 1500}, ...]`

Our raw expense is `{id, amountCents, category, date}`. We need to squish, group, and reshape this into robot-food. This happens in hooks inside `src/analytics.ts`.

### Meal #1: The Category Breakdown (`useCategoryTotals`)

`analytics.ts:54-62`:

```ts
export function useCategoryTotals(filtered: Expense[]) {
  return useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered) {
      map[e.category] = (map[e.category] || 0) + e.amountCents
    }
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [filtered])
}
```

A two-step recipe:

**Step 1 — Build the map.** For each expense, add its `amountCents` to the bucket for its category. If the bucket doesn't exist yet (`|| 0`), start at zero.

**Step 2 — Reshape.** `Object.entries(map)` turns `{food: 5000, transport: 2500}` into `[['food', 5000], ['transport', 2500]]`. Then `.map()` transforms each pair into `{category: 'food', amount: 5000}` — exactly the shape Recharts expects.

This array feeds the `DonutCard` component (`src/components/DonutCard.tsx`). Behind the main donut ring, a faint 20%-opacity ring shows last week's proportions for comparison (computed by `useLastWeekCategoryTotals`). And if you've set budgets, an outer ring at 25% opacity shows the cap for each category — so you can see at a glance whether spending is within bounds.

### Meal #2: The Daily Trend (`useDailyTotals`)

`analytics.ts:75-118`:

```ts
export function useDailyTotals(filtered: Expense[]) {
  return useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const days: { day: string; amount: number; dominantCategory: string }[] = []

    const buckets = new Map<string, { total: number; byCategory: Map<string, number> }>()
    for (const e of filtered) {
      // ... bucket each expense by date
    }
```

Instead of looping 7 times and filtering the entire array each time (the old O(7n) approach), the function now does **one pass** over `filtered` to build a `Map<date, {total, byCategory}>`. Then a 7-iteration loop reads from the map — O(n) + O(7) instead of O(7n).

Each day always gets a bar, even if spending was $0. The function computes a `dominantCategory` per day (the category with the highest total), which is still computed but no longer used for bar coloring — the bars now use a uniform sage fill with a dashed average line instead of the old "color by dominant category" double-encoding.

This feeds the `BarCard` component (`src/components/BarCard.tsx`). The chart includes a dashed `ReferenceLine` at the 7-day average so every bar has context — above or below your normal. On mobile, tapping a bar pins a tooltip showing the exact day and amount.

### Meal #3: The Sentence's Secret Sauce (`deriveSentenceState`)

The sentence header doesn't just display the total — it *interprets* your spending. The `deriveSentenceState` function in `SentenceHeader.tsx:20-57` classifies your data into one of five states:

| State | Condition | Sentence |
|---|---|---|
| `no-expenses` | Zero expenses ever | "Start tracking — your first expense unlocks the dashboard." |
| `empty-timeframe` | Data exists, none in view | "You kept everything last week — $0 out." |
| `single-expense` | Exactly one expense | "$42.00 out this week, on food." (no "mostly") |
| `tied` | Top two categories within 5% | "$150.00 out this week, spread evenly." |
| `default` | Clear dominant category | "$785.00 out this week, mostly on transport." |

The 5% tiebreaker (`top[1] - second[1] < top[1] * 0.05`) prevents the app from declaring a "winner" when two categories are essentially equal. Without it, $50.01 vs $49.99 would say "mostly on X" — technically correct, practically misleading.

Below the sentence, you get two bonus lines when applicable:
- A **trend delta**: "↑ $142.00 from last week" (sage when up, red when down)
- A **budget gauge**: "62% of monthly budget" (red when ≥100%)

And below all of that, a 4-week **sparkline** (`TrendLine.tsx`) shows your weekly totals as tiny relative-height bars — rising, falling, or steady at a glance.

### The Assembly Line: End to End

1. **User types "25", picks "transport", clicks Add Expense.**
2. `validateExpenseInput` checks: is it a number? Positive? Not a future date? Converts to `amountCents = 2500`.
3. `onAdd` fires `setExpenses((prev) => [{id, amountCents: 2500, category: 'transport', date}, ...prev])`.
4. `useLocalStorage`'s `useEffect` persists the new array to localStorage.
5. React re-renders. `useFilteredExpenses` recalculates `filtered` based on `timeframe`.
6. `deriveSentenceState` classifies the data and picks a sentence variant.
7. `useCategoryTotals`, `useDailyTotals`, `useLastWeekCategoryTotals`, and `useWeeklyTrend` each transform `filtered` (or `expenses`) into chart-ready shapes.
8. `SentenceHeader` renders the sentence with the timeframe button, delta, and budget line. `DonutCard` renders the donut with comparison rings. `BarCard` renders the 7-day bars with the average line. `TrendLine` renders the 4-week sparkline.
9. Switch to "last week" via the dropdown: `setTimeframe('last-week')` → `useFilteredExpenses` recalculates → every derived value re-flows through the pipeline — all without touching the original expense list.

That's the heartbeat of receipts.me: **local-first persistence**, **pure data transformation**, **integer-cents math**, and a **sentence that reads your spending back to you**.
