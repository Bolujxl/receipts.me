# Architectural Principles Audit

## Derived State

### Definition
Derived state is data computed during render from existing state or props rather than being duplicated into its own `useState` variable. This eliminates synchronization bugs&#8212;when the source of truth changes, the derived value automatically recalculates, with zero risk of staleness.

### Code References

- **File:** `src/App.tsx`
  - **Lines:** `22-23`
  - **Context:** `filtered` and `total` are assigned via `useFilteredExpenses` and `useTotal`&#8212;neither is backed by a `useState` call. They are derived from the combination of `expenses` and `timeframe`. Changing `timeframe` does not write a new expense list; it simply causes these two variables to recompute against the same immutable source.

- **File:** `src/analytics.ts`
  - **Lines:** `46-47`
  - **Context:** `useFilteredExpenses` wraps `filterByTimeframe(expenses, timeframe)` in `useMemo` with `[expenses, timeframe]` as dependencies. The filtered list is a pure derivation&#8212;it depends on, but never duplicates, `expenses`.

- **File:** `src/analytics.ts`
  - **Lines:** `50-51`
  - **Context:** `useTotal` computes `filtered.reduce((sum, e) => sum + e.amount, 0)`. The total spend is not a state variable; it is the reduction of the filtered array and updates reactively whenever `filtered` changes.

- **File:** `src/analytics.ts`
  - **Lines:** `54-61`
  - **Context:** `useCategoryTotals` derives the donut chart data `[{category, amount}]` from `filtered` by accumulating amounts per category in a local `map` object, then reshaping via `Object.entries(...).map(...)`. No category-total array is ever placed in React state.

- **File:** `src/analytics.ts`
  - **Lines:** `64-82`
  - **Context:** `useDailyTotals` derives the bar chart data (7 `{day, amount}` objects) by iterating a backward 6-day window and chaining `.filter().reduce()` per date. Each re-render recomputes this from `filtered`; it is never independently stored.

- **File:** `src/components/Analytics.tsx`
  - **Lines:** `37-38`
  - **Context:** `categoryTotals` and `dailyTotals` are derived inline from `filtered` via the hooks imported from `../analytics`. They are immediately consumed by the `<Pie data={categoryTotals}>` on line 48 and `<BarChart data={dailyTotals}>` on line 72. At no point are these data arrays persisted to a second `useState`.

---

## Pure Functions for Filtering

### Definition
A pure function produces the same output given the same input and has zero observable side effects&#8212;it does not modify external variables, call `setState`, write to `localStorage`, or depend on anything other than its explicit parameters. Pure functions are trivially testable and immune to ordering or timing bugs.

### Code References

- **File:** `src/analytics.ts`
  - **Lines:** `20-44`
  - **Context:** `filterByTimeframe(expenses, timeframe)` is a textbook pure function. It accepts two parameters and returns an `Expense[]`. It never reads from or writes to module-level mutable state. The internal calls `startOfWeek(now)` and `endOfWeek(now)` depend solely on `new Date()` created inside the function body, which is deterministic within a single synchronous invocation. The `.filter()` on lines 32, 37, and 42 each produce a new array without mutating the `expenses` argument.

- **File:** `src/analytics.ts`
  - **Lines:** `4-11`
  - **Context:** `startOfWeek(d)` accepts a `Date` parameter and returns a new `Date` representing Monday of that week. It creates `new Date(d)` on line 7 to avoid mutating the caller&#8217;s object, sets the derived date and time components, and returns the fresh instance. No external state is touched.

- **File:** `src/analytics.ts`
  - **Lines:** `13-18`
  - **Context:** `endOfWeek(d)` similarly accepts a `Date`, delegates to `startOfWeek(d)` for the Monday anchor, adds 6 days, and returns a new instance. It depends only on its parameter `d`, making it referentially transparent.

---

## Separation of Data and Presentation

### Definition
Business logic (data fetching, transformation, persistence, validation) lives in dedicated modules and hooks. Presentation components receive computed values as props and are responsible only for rendering JSX and forwarding user intent via callbacks. Neither layer imports the other&#8217;s concerns: logic files contain zero JSX; presentation files contain no `localStorage` access or complex math.

### Code References

- **File:** `src/analytics.ts`
  - **Lines:** `1-83` (entire file)
  - **Context:** This module contains four custom hooks and two pure utility functions that perform every data transformation in the application (filtering, summing, category grouping, daily bucketing). It imports `useMemo` from React and `Expense`/`Timeframe` types&#8212;nothing else. The file has zero lines of JSX. Components import the hooks they need; the hooks remain agnostic to how their output is rendered.

- **File:** `src/useLocalStorage.ts`
  - **Lines:** `1-26` (entire file)
  - **Context:** Persistence logic is fully isolated in a generic hook parameterized by key and initial value. The hook manages `localStorage` read/write and exposes a `useState`-compatible tuple. No JSX, no component-specific assumptions&#8212;`App.tsx` calls it at line 11 with the type parameter `Expense[]`, and the hook serves its interface without knowing what an expense is.

- **File:** `src/components/ExpenseForm.tsx`
  - **Lines:** `17-36`
  - **Context:** The form owns its transient UI state (`amount`, `category`, `date`, `error`) but does not persist data. On valid submission, it calls the `onAdd` callback (line 31) with a fully constructed `Expense` object and resets its local fields. It never imports `useLocalStorage`, never touches `localStorage` directly. The persistence concern belongs solely to `App.tsx`.

- **File:** `src/components/Analytics.tsx`
  - **Lines:** `36-38`
  - **Context:** The `Analytics` component receives `filtered` as a prop (line 36). It does not know how `filtered` was produced from the raw expense list. It delegates shape transformation to `useCategoryTotals` and `useDailyTotals` (lines 37-38) imported from `../analytics`. The component&#8217;s output is purely declarative JSX wiring the transformed data into Recharts props.

- **File:** `src/components/Header.tsx`
  - **Lines:** `9-13`
  - **Context:** `Header` receives `total` as a `number` prop and `onTimeframeChange` as a callback. It does not compute the total or filter data itself. It renders the total as formatted currency (line 39) and fires the callback on button clicks (line 24). The component is a pure presentation shell.

---

## Immutability

### Definition
Existing data structures are never modified in place. Instead, new copies are produced via spread syntax, `.filter()`, `.map()`, `.reduce()`, and `useState` updater functions. This guarantees that reference comparisons remain reliable and that no accidental side effect corrupts the source data held in state.

### Code References

- **File:** `src/App.tsx`
  - **Line:** `45`
  - **Context:** The `onAdd` handler produces the next expense list as `(prev) => [e, ...prev]`. The spread operator `...prev` creates a shallow copy of the existing array with the new element prepended. No `.push()` mutation touches `prev`; React receives a new array reference, which triggers re-render.

- **File:** `src/analytics.ts`
  - **Lines:** `32, 37, 42`
  - **Context:** All three branches of `filterByTimeframe` use `expenses.filter(...)`, which returns a new array containing only matching elements. The `expenses` parameter is never mutated. Even the `'all-time'` branch on line 42 returns the original reference&#8212;which is safe because the caller (`useFilteredExpenses`) only reads it.

- **File:** `src/analytics.ts`
  - **Line:** `51`
  - **Context:** `filtered.reduce((sum, e) => sum + e.amount, 0)` iterates the array without modifying it, returning a new primitive. The accumulator `sum` is a local variable rebuilt on each call.

- **File:** `src/analytics.ts`
  - **Lines:** `56-60`
  - **Context:** `useCategoryTotals` builds a temporary `Record<string, number>` map inside the `useMemo` callback, then returns `Object.entries(map).map(...)`. The `map` object is local to the callback scope and discarded after `.map()` produces the result array&#8212;no external object is mutated.

- **File:** `src/analytics.ts`
  - **Lines:** `75-77`
  - **Context:** `useDailyTotals` chains `filtered.filter(...).reduce(...)` inside each day iteration. Each chain produces a new filtered array and a new reduced number. The `days` array on line 68 is built via `.push()` but is local to the `useMemo` callback and freely mutable before being returned as the final result.

- **File:** `src/components/ExpenseForm.tsx`
  - **Lines:** `38-41`
  - **Context:** After form submission, the local state is reset via `setAmount('')`, `setCategory('food')`, `setDate(todayISO)`, and `setError('')`. These are `setState` calls that replace the state with new values&#8212;the previous state strings are never mutated in place.

---

## Single Source of Truth

### Definition
Every unit of displayed or persisted data in the application traces back to exactly one canonical location. No component independently caches or duplicates the expense list. Downstream consumers receive derived slices through props or hooks, ensuring that any mutation to the source propagates consistently across every view.

### Code References

- **File:** `src/App.tsx`
  - **Line:** `11`
  - **Context:** `const [expenses, setExpenses] = useLocalStorage<Expense[]>('receipts_data', [])` is the single authoritative array for all expense data. This line is the sole declaration of the expense list. Every computed value elsewhere in the app is a function of `expenses` (and optionally `timeframe`).

- **File:** `src/App.tsx`
  - **Lines:** `22-23`
  - **Context:** `filtered` and `total` are derived from `expenses`. Neither is independently stored or synced. A change to `expenses` (via `setExpenses` on line 17 or line 45) automatically flows through these derivations without any manual propagation logic.

- **File:** `src/App.tsx`
  - **Lines:** `52, 42`
  - **Context:** `Analytics` receives `filtered` (derived from `expenses`); `Header` receives `total` (derived from `filtered`). Neither component holds its own `useState`-based copy of the expense list. The chain `expenses` &#8594; `filtered` &#8594; `total` / `categoryTotals` / `dailyTotals` is unidirectional and acyclic.

- **File:** `src/App.tsx`
  - **Lines:** `15-18`
  - **Context:** Seed data is injected through the same `setExpenses` setter: `if (expenses.length === 0) { setExpenses(seedExpenses) }`. The seed writes into the canonical state, not into a separate "demo data" variable. After seeding, the same derivation pipeline produces meaningful charts immediately.

- **File:** `src/components/Analytics.tsx`
  - **Lines:** `17-18, 37-38`
  - **Context:** The `Analytics` component accepts `filtered` as its sole data prop. It derives `categoryTotals` and `dailyTotals` from that single prop. It has no import of `useLocalStorage`, no reference to the `'receipts_data'` key, and no `useState` holding a secondary expense array.

- **File:** `src/useLocalStorage.ts`
  - **Lines:** `6-7, 15`
  - **Context:** The hook reads from `localStorage` during the `useState` initializer and writes back in the `useEffect`. This makes `localStorage` a mirror of the in-memory state rather than a competing source. The canonical truth lives in React state; `localStorage` is a persistence layer that follows it.

---

