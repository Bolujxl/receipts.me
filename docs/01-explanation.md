# How It Works: The Journey of a Receipt

## 1. The Starting Line: Making the Data

Imagine you have a magic notebook. Every time you spend money on something&#8212;lunch, a bus ride, a Netflix subscription&#8212;you scribble it down on a sticky note and slap it onto the notebook&#8217;s cover. That sticky note is an *Expense*. And the notebook? That&#8217;s React&#8217;s state&#8212;a living list that remembers everything you&#8217;ve ever written, even if you close the app and come back tomorrow.

But before the sticky note reaches the notebook, it has to pass through a little robot called the **Form**. The form is a strict quality inspector. It won&#8217;t let a bad sticky note through. Let&#8217;s watch the inspector do its job, line by line. 

### Line-by-Line Breakdown: The `handleSubmit` Journey

Everything starts in `src/components/ExpenseForm.tsx:17`&#8212;the `handleSubmit` function.

```ts
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
```

When you click the big "Add Expense" button, the browser&#8217;s default instinct is to reload the page. `e.preventDefault()` tells the browser, &#8220;Stop right there&#8212;*I&#8217;m* driving.&#8221;

```ts
  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed <= 0) {
    setError('Enter a positive amount.')
    return
  }
```

The `amount` state variable (`ExpenseForm.tsx:12`) holds whatever you typed into the number input as a *string*. `parseFloat` tries to turn that string into a real number. If you typed `"banana"` or left it empty, `parseFloat` returns `NaN` (Not-a-Number), and the guard slams the gate shut. It also rejects zero or negative amounts, because spending -$5 makes no sense in the real world.

```ts
  if (date > todayISO) {
    setError('Future dates are not allowed.')
    return
  }
```

On line 9, `todayISO` is calculated once when the component mounts:

```ts
const todayISO = new Date().toISOString().split('T')[0]
```

This gives us a string like `"2026-06-07"`. If you try to set a receipt&#8217;s date to tomorrow or next year, the inspector says &#8220;Nope, you can&#8217;t spend money you haven&#8217;t spent yet.&#8221;

Now the fun part&#8212;the inspector stamps the sticky note and sends it flying up to the notebook:

```ts
  onAdd({
    id: crypto.randomUUID(),
    amount: parsed,
    category,
    date,
  })
```

This is the birth of an `Expense` object. Let&#8217;s look at the shape, defined in `src/types.ts:3-8`:

```ts
export interface Expense {
  id: string
  amount: number
  category: Category
  date: string
}
```

- **`id: crypto.randomUUID()`** &#8211; Every sticky note gets a globally unique fingerprint (like `"a1b2c3d4-..."`). If two notes had the same ID, React would get confused about which is which. `crypto.randomUUID()` guarantees this never happens.
- **`amount: parsed`** &#8211; The number version of what you typed (e.g., `42.5`, not `"42.5"`).
- **`category: category`** &#8211; One of `'food' | 'transport' | 'data' | 'fun' | 'other'`, pulled from the local state initialized on `ExpenseForm.tsx:13` (defaults to `'food'`).
- **`date: date`** &#8211; The ISO date string, validated above.

After stamping, the inspector tidies up its desk:

```ts
  setAmount('')
  setCategory('food')
  setDate(todayISO)
  setError('')
}
```

Everything resets so you&#8217;re ready to add the next expense immediately.

### Where Does the Note Actually Go?

The `onAdd` prop is wired up in `src/App.tsx:44-46`:

```ts
<ExpenseForm
  onAdd={(e) => setExpenses((prev) => [e, ...prev])}
/>
```

This is the moment the sticky note hits the notebook. `setExpenses` is the setter returned by our `useLocalStorage` hook. It takes the *previous* array of expenses and returns a *brand new* array with the new expense at the front (`...prev` spreads the old notes after the new one). This is **immutable update**&#8212;we never modify the old array in place; we create a fresh one, because React compares references to know when to re-render.

### The Vault: How `useLocalStorage` Works

The genius of this app is that data survives a page refresh. The magic is in `src/useLocalStorage.ts`:

```ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })
```

When the app first mounts, `useState` runs its **initializer function**. It reaches into the browser&#8217;s `localStorage` (a key-value storage closet built into every browser) and looks for the key `'receipts_data'`. If it finds it, `JSON.parse` un-freezes the data from a string back into a JavaScript array. If the closet is empty, it uses `initialValue` (an empty array `[]`), which triggers the seed data logic we&#8217;ll see in a moment.

The read is wrapped in `try/catch` in case the stored data is corrupted&#8212;parsing bad JSON throws an error, and we gracefully fall back to an empty array.

```ts
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable
    }
  }, [key, value])
```

Every time `value` changes (i.e., every time you add an expense), this `useEffect` automatically calls `JSON.stringify` to freeze the array into a string and stash it back in the closet. The dependency array `[key, value]` means &#8220;run this whenever `key` or `value` changes.&#8221;

The `catch` block is silent&#8212;if `localStorage` is full or blocked (e.g., Safari private mode), the app still works in memory; it just won&#8217;t persist.

```ts
  return [value, set] as const
```

The hook returns a tuple exactly like `useState`&#8217;s `[getter, setter]`, so App.tsx can destructure it identically:

```ts
const [expenses, setExpenses] = useLocalStorage<Expense[]>('receipts_data', [])
```

### The Seed: First-Time Visitors Get a Welcome Gift

Back in `src/App.tsx:15-20`:

```ts
useEffect(() => {
  if (expenses.length === 0) {
    setExpenses(seedExpenses)
  }
  setHydrated(true)
}, [])
```

This `useEffect` runs **once** when the app first mounts (empty dependency array `[]`). If the expenses list is empty&#8212;meaning the user is brand new&#8212;it populates the notebook with five colorful example expenses from `src/seed.ts`. Each is a pre-built `Expense` object with realistic amounts and categories spread across the last 6 days. The user sees a living demo instead of a blank, intimidating screen.

The `hydrated` state starts `false` and flips to `true` here. Before hydration, `App.tsx:25-31` renders a simple &#8220;Loading&#8230;&#8221; message&#8212;this prevents a flash of empty UI while the seed writes to `localStorage`.

---

## 2. The Magic Glasses: Filtering the Truth

Now you&#8217;ve got a drawer full of sticky notes&#8212;receipts from today, last month, maybe last year. The drawer is heavy. You don&#8217;t want to carry the whole thing around. So you pull out a pair of **Magic Glasses**.

When you put on the red glasses, you can *only* see notes from this week. Blue glasses show last week. Clear glasses show everything. But&#8212;and this is the most important thing&#8212;**the drawer itself never changes.** The glasses don&#8217;t rip up or scribble out the other notes. They just hide them from view. You can swap glasses all day long, and the original drawer stays perfectly intact.

This is exactly what `.filter()` does. It creates a *copy* of the array containing only the items that match a rule. It is **non-destructive** and **non-mutative**.

### How the Glasses Get Chosen: The Header

In `src/components/Header.tsx:3-7`, we define the three lenses:

```ts
const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'all-time', label: 'All Time' },
]
```

Each button, when clicked (`Header.tsx:24`), calls:

```ts
onClick={() => onTimeframeChange(t.value)}
```

Which in App.tsx translates to `setTimeframe(t.value)`, updating the `timeframe` state variable (`App.tsx:13`). The active button gets highlighted with `bg-zinc-800` (`Header.tsx:27`), giving the user a clear visual of which glasses are on.

### The Lens Itself: `filterByTimeframe`

The heavy lifting happens in `src/analytics.ts:20-44`. Let&#8217;s walk through `filterByTimeframe`:

```ts
export function filterByTimeframe(expenses: Expense[], timeframe: Timeframe): Expense[] {
  const now = new Date()
```

We grab the current moment. Everything is relative to *right now*.

```ts
  const thisMonday = startOfWeek(now)
  const thisSunday = endOfWeek(now)
```

The helper functions `startOfWeek` and `endOfWeek` (`analytics.ts:4-18`) calculate Monday at 00:00:00.000 and Sunday at 23:59:59.999 of the current week.

`startOfWeek` works like this: `getDay()` returns 0 for Sunday, 1 for Monday, etc. The formula `diff = d.getDate() - day + (day === 0 ? -6 : 1)` shifts the date backward to Monday. For example, if today is Wednesday the 10th, `day` is 3, so `diff = 10 - 3 + 1 = 8`, giving you Monday the 8th.

```ts
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(lastMonday.getDate() - 7)
  const lastSunday = new Date(thisSunday)
  lastSunday.setDate(lastSunday.getDate() - 7)
```

For &#8220;Last Week,&#8221; we take this week&#8217;s boundaries and subtract 7 days. Simple, clean, no magic.

Now the big switch:

```ts
  switch (timeframe) {
    case 'this-week':
      return expenses.filter((e) => {
        const d = new Date(e.date)
        return d >= thisMonday && d <= thisSunday
      })
```

`.filter()` walks through every single expense in the original array. For each one, it asks: &#8220;Does this note&#8217;s date fall between Monday and Sunday of *this* week?&#8221; If yes, the note gets copied into a brand-new array. If no, it&#8217;s skipped.

Crucially, `expenses.filter(...)` does **not** modify the `expenses` array. It returns a fresh array. The original lives untouched in `useLocalStorage` state, safe and sound.

```ts
    case 'last-week':
      return expenses.filter((e) => {
        const d = new Date(e.date)
        return d >= lastMonday && d <= lastSunday
      })
```

Same idea, shifted back 7 days.

```ts
    case 'all-time':
      return expenses
  }
}
```

The clear glasses: no filtering at all. Returns the original reference. (Still no mutation, just passing through.)

### Wrapping it in `useMemo`

In `analytics.ts:46-48`:

```ts
export function useFilteredExpenses(expenses: Expense[], timeframe: Timeframe) {
  return useMemo(() => filterByTimeframe(expenses, timeframe), [expenses, timeframe])
}
```

`useMemo` is like a smart bookmark. It says: &#8220;Only re-run `filterByTimeframe` if `expenses` or `timeframe` actually changed.&#8221; Without it, every time the component re-renders (even for unrelated reasons), we&#8217;d recalculate the filtered list from scratch. Since filtering involves creating new `Date` objects for every expense, this would be wasteful. `useMemo` memoizes (remembers) the result and hands it back instantly unless the inputs are new.

Back in `App.tsx:22`:

```ts
const filtered = useFilteredExpenses(expenses, timeframe)
```

`filtered` is now the shelf of notes visible through whichever glasses you&#8217;re wearing. It&#8217;s a **derived state**&#8212;a value calculated from `expenses` and `timeframe`, never stored independently.

---

## 3. Feeding the Robot: How the Charts Eat Data

You&#8217;ve got your filtered sticky notes. Now you want to show them off. But the charting library (Recharts) is a **picky robot**. It will only eat food prepared in a very specific shape. If you hand it the raw `Expense[]` array, the robot beeps angrily and shuts down.

The robot&#8217;s required diet:

- **Pie/Donut Chart:** Eats `[{category: 'food', amount: 50}, {category: 'transport', amount: 25}, ...]`
- **Bar Chart:** Eats `[{day: 'Mon', amount: 42}, {day: 'Tue', amount: 15}, ...]`

Our raw expense looks like `{id, amount, category, date}`. We need to squish, group, and reshape this data into robot-food format. This is **data transformation**, and it happens in three custom hooks inside `src/analytics.ts`.

### Meal #1: The Grand Total (`useTotal`)

`analytics.ts:50-52`:

```ts
export function useTotal(filtered: Expense[]) {
  return useMemo(() => filtered.reduce((sum, e) => sum + e.amount, 0), [filtered])
}
```

`.reduce()` takes an array and squishes it down into a single value. It walks through each expense, adding its `amount` to a running `sum`. The `0` at the end is the starting sum (an empty jar).

Walk-through for `filtered = [{amount: 10}, {amount: 20}, {amount: 5}]`:

| Step | `e`           | `sum` before | `sum + e.amount` | `sum` after |
|------|---------------|-------------|-------------------|-------------|
| 0    | (start)       | 0           | &#8211;            | 0           |
| 1    | `{amount:10}` | 0           | `0 + 10`          | 10          |
| 2    | `{amount:20}` | 10          | `10 + 20`         | 30          |
| 3    | `{amount:5}`  | 30          | `30 + 5`          | 35          |

Result: `35`. This single number flows into `App.tsx:23` as `total`, then into the `Header` component where it&#8217;s displayed as the big dollar amount (`Header.tsx:38-39`):

```ts
${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
```

`toLocaleString` formats `35` as `"35.00"` and `1234.5` as `"1,234.50"`.

### Meal #2: The Donut&#8217;s Dinner (`useCategoryTotals`)

`analytics.ts:54-62`:

```ts
export function useCategoryTotals(filtered: Expense[]) {
  return useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered) {
      map[e.category] = (map[e.category] || 0) + e.amount
    }
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [filtered])
}
```

This is a two-step recipe:

**Step 1 &#8211; Build the map:** We create an empty dictionary `{}`. For each expense, we look at its category. If the category key doesn&#8217;t exist yet in the map, `map[e.category] || 0` gives `0`. Then we add the expense&#8217;s amount to whatever was already there.

Example with 3 food expenses ($10, $5, $20) and 2 transport ($15, $8):

| Iteration | `e.category` | `e.amount` | `map` after                                         |
|-----------|-------------|-----------|-----------------------------------------------------|
| 1         | `'food'`    | 10        | `{ food: 10 }`                                      |
| 2         | `'transport'`| 15       | `{ food: 10, transport: 15 }`                      |
| 3         | `'food'`    | 20        | `{ food: 30, transport: 15 }`                      |
| 4         | `'transport'`| 8        | `{ food: 30, transport: 23 }`                      |
| 5         | `'food'`    | 5         | `{ food: 35, transport: 23 }`                      |

**Step 2 &#8211; Reshape for the robot:** `Object.entries(map)` converts `{food: 35, transport: 23}` into `[['food', 35], ['transport', 23]]`. Then `.map()` transforms each inner array into an object with `category` and `amount` keys:

```ts
[{ category: 'food', amount: 35 }, { category: 'transport', amount: 23 }]
```

This exact shape is fed directly into the `PieChart` in `src/components/Analytics.tsx:46-63`:

```ts
<PieChart>
  <Pie
    data={categoryTotals}        // ← the robot-food array
    dataKey="amount"             // ← which property holds the slice size
    nameKey="category"           // ← which property is the label
    innerRadius={60}             // ← makes it a donut (hole in middle)
    outerRadius={100}
  >
    {categoryTotals.map((_, i) => (
      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
    ))}
  </Pie>
</PieChart>
```

Each `Cell` receives a color from the `DONUT_COLORS` palette (`analytics.tsx:15`). The `i % DONUT_COLORS.length` trick means if you somehow have more categories than colors, it loops around (modulo wraps back to the start).

The `CustomTooltip` (`Analytics.tsx:21-34`) extracts `category` and `amount` from the hovered slice&#8217;s `payload` and renders them with proper currency formatting.

### Meal #3: The Bar Chart&#8217;s Breakfast (`useDailyTotals`)

`analytics.ts:64-82`:

```ts
export function useDailyTotals(filtered: Expense[]) {
  return useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const days: { day: string; amount: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const dayLabel = dayNames[d.getDay()]
      const total = filtered
        .filter((e) => e.date === iso)
        .reduce((sum, e) => sum + e.amount, 0)
      days.push({ day: dayLabel, amount: total })
    }

    return days
  }, [filtered])
}
```

The robot wants exactly **7 bars**, one for each day of the week, even if you spent $0 that day. Here&#8217;s how we build that guarantee:

**The backward loop:** `for (let i = 6; i >= 0; i--)` counts from 6 down to 0. This means we start with 6 days ago and end with today, building the array left-to-right (oldest day first).

**Constructing each day:**

```ts
const d = new Date(today)
d.setDate(d.getDate() - i)
```

If today is Saturday, and `i = 6`, `d` becomes last Sunday. If `i = 0`, `d` is today (Saturday).

```ts
const iso = d.toISOString().split('T')[0]
```

Converts to `"2026-06-07"` format&#8212;matching exactly how dates are stored in our `Expense` objects.

```ts
const dayLabel = dayNames[d.getDay()]
```

`getDay()` returns 0-6 (Sun-Sat), giving us the human-readable label.

```ts
const total = filtered
  .filter((e) => e.date === iso)
  .reduce((sum, e) => sum + e.amount, 0)
```

This is a **chained operation**: first `.filter()` picks only expenses matching this specific date, then `.reduce()` sums their amounts. If no expenses match, the filter returns an empty array, and the reduce gracefully produces `0`.

```ts
days.push({ day: dayLabel, amount: total })
```

Each day gets pushed in. The result always looks like:

```ts
[
  { day: 'Sun', amount: 0 },
  { day: 'Mon', amount: 23.45 },
  { day: 'Tue', amount: 0 },
  { day: 'Wed', amount: 42.50 },
  { day: 'Thu', amount: 15 },
  { day: 'Fri', amount: 0 },
  { day: 'Sat', amount: 65 },
]
```

This feeds the `BarChart` in `Analytics.tsx:72-92`:

```ts
<BarChart data={dailyTotals}>
  <XAxis dataKey="day" />          {/* ← bottom labels: Sun, Mon, Tue... */}
  <YAxis tickFormatter={(v) => `$${v}`} />  {/* ← side labels formatted as dollars */}
  <Bar dataKey="amount" />         {/* ← bar height comes from the amount property */}
</BarChart>
```

The `dataKey="day"` on `XAxis` reads the `day` property from each object for the bottom labels. The `dataKey="amount"` on `Bar` reads the `amount` property for the bar heights. The shape matches perfectly.

### The Assembly Line: How It All Connects

Let&#8217;s trace the full journey one more time, end to end:

1. **User types &#8220;25&#8221;, picks &#8220;food&#8221;, clicks Add Expense.**
2. `ExpenseForm.handleSubmit` validates, builds `{id, amount: 25, category: 'food', date: '2026-06-07'}`.
3. `onAdd` fires `setExpenses((prev) => [newExpense, ...prev])` in `App.tsx`.
4. `useLocalStorage`&#8217;s `useEffect` persists the new array to `localStorage('receipts_data', ...)`.
5. React re-renders `App`. `useFilteredExpenses` runs (memoized), filtering the full list into `filtered` based on the current timeframe.
6. `useTotal(filtered)`, `useCategoryTotals(filtered)`, and `useDailyTotals(filtered)` each transform the filtered data into chart-ready shapes.
7. `Header` displays the total. `Analytics` renders the donut and bar charts with the transformed data.
8. If the user clicks &#8220;Last Week&#8221; in the Header, `setTimeframe('last-week')` triggers a re-render, `useFilteredExpenses` recalculates, and the entire pipeline re-flows with a narrower window of data&#8212;all without ever touching the original expense list.

That&#8217;s the heartbeat of Receipts: **local-first persistence**, **immutable filtering**, and **pure data transformation**. Every piece knows exactly what shape of data to expect and exactly what shape to produce.
