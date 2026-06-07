# Edge-Case & Defensive Architecture Audit

## 1. Storage Catastrophe (localStorage Failures)

### Current State

The `useLocalStorage` hook (`src/useLocalStorage.ts`) implements a dual-layer try/catch defensive pattern:

**Read path (lines 5-10):** The `useState` initializer wraps `localStorage.getItem(key)` in a try/catch. If `getItem` throws (unlikely in modern browsers), the catch block at line 8 returns `initialValue`&#8212;an empty `Expense[]` array. In private/incognito mode, `getItem` does not throw; it returns `null`. The ternary at line 7&#8212;`stored ? (JSON.parse(stored) as T) : initialValue`&#8212;correctly falls through to `initialValue` when `stored` is falsy. The app boots with an empty array.

**Write path (lines 13-18):** The `useEffect` wraps `localStorage.setItem(key, JSON.stringify(value))` in a try/catch. When storage is disabled or the 5 MB quota is exceeded, `setItem` throws a `DOMException`. The catch block at lines 16-17 silently swallows the exception with the comment `// storage full or unavailable`. The in-memory React state (`value`) remains intact; no error boundary is tripped, no white screen appears. The app continues to operate&#8212;it simply loses persistence.

**App entry (App.tsx, lines 15-18):** When `expenses.length === 0` (the post-catastrophe condition if the user had no prior data), `seedExpenses` is written into memory via `setExpenses`. This populates the dashboard with demo data regardless of storage health.

Two latent concerns exist:

1. **Silent write failures on every state change.** Every call to `setExpenses` triggers the `useEffect` at `useLocalStorage.ts:13-19`, which reattempts the doomed `setItem`. In a quota-exceeded scenario, this produces a steady stream of swallowed exceptions with no user feedback. The user has no indication that their data is ephemeral.

2. **Type-unsafe hydration.** The line `JSON.parse(stored) as T` at line 7 is a type assertion, not a runtime guard. If `localStorage` contains valid JSON of an unexpected shape (e.g., a single object instead of an array, or an array of strings), the parse succeeds silently and the cast passes through. Downstream code assumes `Expense[]`&#8212;calling `.filter()`, `.reduce()`, and destructuring `.amount` and `.category`&#8212;and would throw if the shape were wrong. The catch at line 8 covers only `JSON.parse` failures (malformed JSON), not schema mismatches (valid JSON, wrong structure).

### Vulnerability Level: Low

The app degrades gracefully&#8212;it renders, accepts input, and displays charts entirely from in-memory state. No crash, no white screen. The missing feedback on ephemeral data and the unprotected JSON-to-TypeScript cast are real but non-critical gaps.

### Recommended Fix

Add a `storageAvailable` flag exposed from `useLocalStorage` to warn the user when writes fail consistently, and introduce a schema validation step (e.g., a Zod schema or a manual `Array.isArray` + shape check) after `JSON.parse` before the `as T` cast.

---

## 2. The Ghost Town (Empty State)

### Current State

A true zero-expense state is effectively unreachable in normal operation due to the seed logic in `App.tsx:15-18`:

```ts
useEffect(() => {
  if (expenses.length === 0) {
    setExpenses(seedExpenses)
  }
  setHydrated(true)
}, [])
```

On first load (empty `localStorage`), `expenses` starts as `[]`, the `useEffect` runs once, detects `length === 0`, and populates five pre-built expenses from `seed.ts`. The user never sees a blank dashboard.

However, a zero-expense state *is* theoretically reachable via two paths:

1. **Corrupted localStorage returns an empty non-null value** that passes JSON.parse as an empty array (e.g., user manually edits `'receipts_data'` to `"[]"` in DevTools after the seed has already run). The seed check at line 16 fires on mount only with `[]` dependency; if the user clears `localStorage` while the app is running, the seed logic does not re-execute.

2. **A future feature allowing expense deletion** could reduce the array to zero after the seed effect has already passed.

If zero expenses were to occur, the downstream behavior would be:

| Hook / Component | Input | Behavior |
|---|---|---|
| `useFilteredExpenses` (`analytics.ts:46`) | `[]` | Returns `[]` for all timeframes |
| `useTotal` (`analytics.ts:50`) | `[]` | `.reduce()` on empty array with seed `0` returns `0` |
| `useCategoryTotals` (`analytics.ts:54`) | `[]` | `Object.entries({})` yields `[]`; returns `[]` |
| `useDailyTotals` (`analytics.ts:64`) | `[]` | Each of 7 days: `.filter()` returns `[]`, `.reduce()` returns `0`; returns `[{day:'Sun',amount:0},...]` |
| `Header` (`Header.tsx:38-39`) | `total = 0` | Displays `$0.00` |
| `PieChart` (`Analytics.tsx:46-63`) | `data = []` | Recharts renders an empty SVG donut&#8212;a hollow circle with no slices and no labels |
| `BarChart` (`Analytics.tsx:72-92`) | `data = [{day, amount:0}*7]` | Renders 7 flat bars of zero height; `YAxis tickFormatter` at line 83 calls `` `$${0}` `` producing `$0` ticks |

No component throws, crashes, or renders broken layout. But the user experience would be ambiguous: an empty donut and seven flat bars without any textual explanation that the dashboard is intentionally empty rather than broken. The `DONUT_COLORS` palette at `Analytics.tsx:15` has 5 colors; an empty `categoryTotals` array at line 58 would map zero `<Cell>` children, producing an inert SVG.

### Vulnerability Level: Low

The seed data prevents real-world exposure. The underlying code handles the zero case without crashing, though the UX is unnavigated.

### Recommended Fix

If expense deletion is ever added, introduce an explicit empty-state component rendered when `expenses.length === 0` (after hydration is complete), with a call-to-action to add the first expense, rather than relying on Recharts silently rendering zero-data charts.

---

## 3. The Hoarder (Scale & Performance)

### Current State

The application renders **zero individual expense DOM nodes**. There is no list, table, or agenda view of expenses. All rendering is through Recharts, which receives aggregated summary data: at most 5 donut slices (one per category) and 7 bar chart columns (one per day). This means the DOM node count is bounded by the chart library&#8217;s internal SVG elements, not by the size of the expense list. An array of 10,000 expenses produces the same number of rendered `<path>` and `<rect>` elements as 10 expenses.

The computational cost scales linearly:

| Computation | Location | Complexity | 1,000 items cost |
|---|---|---|---|
| `filterByTimeframe` | `analytics.ts:32,37` | O(n) per call, memoized via `useMemo` | ~1,000 iterations per timeframe change |
| `useTotal` | `analytics.ts:50-51` | O(n) on `filtered`, memoized | ~1,000 additions per filtered change |
| `useCategoryTotals` | `analytics.ts:54-61` | O(n) single pass, memoized | ~1,000 iterations per filtered change |
| `useDailyTotals` | `analytics.ts:64-82` | O(7n) via nested `.filter() + .reduce()`, memoized | ~7,000 filter checks + reductions per filtered change |

At 10,000 expenses, `useDailyTotals` performs roughly 70,000 predicate evaluations (7 days &#215; 10,000 expenses) per timeframe switch. Each predicate creates a `new Date(e.date)` object and compares it to an ISO string. This executes synchronously inside `useMemo` during a React render cycle. On modern hardware, 70,000 iterations in a single synchronous block could cause a frame drop of ~5-15 ms&#8212;perceptible but not a full freeze.

The actual bottleneck is the `filter()` inside the loop at `analytics.ts:75-76`:

```ts
const total = filtered
  .filter((e) => e.date === iso)
  .reduce((sum, e) => sum + e.amount, 0)
```

This filters the *entire* `filtered` array for each of 7 days. An optimization would be to pre-bucket expenses by date in a single O(n) pass over `filtered`, reducing the 7-day loop to O(1) lookups. At 1,000 items this optimization is unnecessary; at 50,000 it becomes essential.

Critically, all computation is guarded by `useMemo` with `[filtered]` as a dependency (`analytics.ts:47, 51, 61, 82`). Adding a new expense reprocesses the array; toggling between timeframes reprocesses; but idle renders trigger zero recomputation.

### Vulnerability Level: Low

For the expected usage pattern (a personal finance tracker accumulating maybe a few hundred expenses per year), the current O(n) approach is more than adequate. The absence of a rendered list eliminates the DOM-side scaling concerns entirely.

### Recommended Fix

If the app ever grows beyond personal use or adds an expense-list view, pre-bucket `useDailyTotals` to O(n) total work: iterate `filtered` once, accumulate into a `Map<string, number>` keyed by ISO date, then read from the map inside the 7-day loop. For a list view, add virtual scrolling (e.g., `@tanstack/react-virtual`).

---

## 4. Data Corruption (Category Typos)

### Current State

The type system provides the first line of defense:

**Compile-time constraint (types.ts:1):**
```ts
export type Category = 'food' | 'transport' | 'data' | 'fun' | 'other'
```

**UI constraint (ExpenseForm.tsx:67-69, 72-76):**
The category input is a `<select>` element populated exclusively from `CATEGORIES` (`types.ts:10`). The user cannot type an arbitrary string. The `onChange` handler at line 69 casts the event target value:

```ts
onChange={(e) => setCategory(e.target.value as Category)}
```

This is a type assertion (`as`), not a runtime guard. If a bad value managed to reach this handler, TypeScript would not catch it at runtime. However, because the `<select>` only renders `<option>` elements from `CATEGORIES`, the browser&#8217;s native form control constrains `e.target.value` to one of the five union members. This is a reliable constraint in practice.

**The real attack surface is the persistence boundary (useLocalStorage.ts:7):**

```ts
return stored ? (JSON.parse(stored) as T) : initialValue
```

The `as T` cast trusts the shape of whatever `JSON.parse` produces. A user with DevTools access can write:

```json
[{"id":"abc","amount":99,"category":"foood","date":"2026-06-01"}]
```

The JSON parses successfully. The `as Expense[]` cast suppresses TypeScript&#8217;s warnings (because `T` is `Expense[]` and we&#8217;ve asserted it). The downstream consumer (`useCategoryTotals` at `analytics.ts:56-58`) uses a generic `Record<string, number>`, not `Record<Category, number>`, meaning it accepts any string key:

```ts
const map: Record<string, number> = {}
for (const e of filtered) {
  map[e.category] = (map[e.category] || 0) + e.amount
}
```

A `"foood"` category would create a new bucket in the map, produce a `{category: 'foood', amount: 99}` entry, and render a sixth donut slice with an unknown label. The `DONUT_COLORS` array at `Analytics.tsx:15` has 5 colors; the sixth category would wrap via `i % 5` and reuse `'#a1a1aa'`, causing two slices to share a color. No crash, but silently misleading UI.

The `CustomTooltip` at `Analytics.tsx:30` calls `.capitalize` on the category name, which would display `"Foood"` harmlessly.

### Vulnerability Level: Medium

The `<select>` UI constraint and TypeScript union type make runtime injection difficult through normal usage. But the `as T` cast over `JSON.parse` at the persistence boundary means corrupted `localStorage` data can silently introduce invalid categories that propagate through the entire pipeline without validation or error. No runtime schema check exists anywhere between `useLocalStorage` and the chart render pipeline.

### Recommended Fix

Add a runtime validation layer after `JSON.parse` in `useLocalStorage.ts`. A minimal approach: check `Array.isArray(stored)` and verify each element has the required keys with valid types. For a more robust solution, use `zod` (already a lightweight dependency at 3 KB minified) to define a runtime schema that mirrors the `Expense` interface and call `.safeParse()`; on failure, fall back to `initialValue` and log a warning.

---

## 5. The Hubris of the Dollar (Currency Assumptions)

### Current State

Four locations hardcode US-centric currency assumptions with no abstraction for locale, currency, or regional formatting. The app is functionally locked to `$` and `en-US`:

| # | File | Line | Code | Issue |
|---|---|---|---|---|
| 1 | `ExpenseForm.tsx` | 52 | `<span>$</span>` | Hardcoded `$` prefix in the amount input field. No abstraction, no locale awareness. |
| 2 | `Header.tsx` | 38-39 | `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` | Double hardcode: the `$` prefix sits outside `toLocaleString`, and `'en-US'` is hardcoded as the locale. A European user inputting `1,200.50` sees `$1,200.50` instead of `€1.200,50` or `1.200,50 €`. |
| 3 | `Analytics.tsx` | 24-27 | `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)` | Uses the proper `Intl.NumberFormat` API but hardcodes `'en-US'` and `'USD'`. The `style: 'currency'` option is correct and would adapt symbol placement and decimal separators if `'de-DE'` and `'EUR'` were passed&#8212;the infrastructure is in place; only the parameters are fixed. |
| 4 | `Analytics.tsx` | 83 | `tickFormatter={(v) => `$${v}`}` | Chars axis tick formatter with hardcoded `$` prefix. No locale formatting applied to the Y-axis ticks beyond the raw `$${v}` concatenation. |

No file uses `navigator.language` to detect the user&#8217;s browser locale. No file exposes a configurable currency preference. There is no localization context provider.

### Vulnerability Level: High

This is the most pervasive assumption in the codebase. The app is functionally correct for US users and misleading or broken for anyone expecting a different currency. Every dollar sign in the UI is a literal `$` character embedded in JSX, not a dynamic symbol derived from the browser&#8217;s `Intl` APIs. This affects all three visible surfaces: the input field, the header total, and both chart tooltips.

### Recommended Fix

Introduce a `CurrencyContext` provider that reads `navigator.language` on mount (falling back to `'en-US'`) and exposes a `formatCurrency(amount: number)` function wrapping `Intl.NumberFormat` with auto-derived locale and currency. Replace all four hardcoded sites with this function. Remove the literal `$` span from `ExpenseForm.tsx:52` or make it dynamic via the same context.

---

## Final Verdict

The Receipts application demonstrates strong defensive foundations for a stage-1 prototype. Storage failures are caught and swallowed gracefully; the O(n) computation pipeline is bounded by `useMemo` and has no rendering explosion path; the seed data mechanism prevents the empty-state UX pitfall entirely. The two material vulnerabilities center on **trust of external data** and **hardcoded locale assumptions**. The `as T` cast over `JSON.parse` in `useLocalStorage` creates a pipeline that accepts any JSON shape without validation&#8212;a corruption vector that would silently produce nonsensical chart slices. The four hardcoded `$`/`en-US`/`USD` anchors lock the app to a single market. Both are fixable with targeted, low-effort refactors: a schema guard at the persistence boundary and a centralized currency formatter. The remaining vectors (scale, empty pages, storage unavailability) are adequately defended for the current feature set.
