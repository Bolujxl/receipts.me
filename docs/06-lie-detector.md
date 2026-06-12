# Adversarial Architecture Audit (Lie Detector)

## The Core Machinery Statements
*Review the following five statements regarding our React architecture and data flow. One is a complete fabrication.*

1. **`useLocalStorage` accepts an optional `validator` callback that runs after `JSON.parse`.** If the validator returns `null`, the hook discards the parsed payload, logs a console warning with the key name, and falls back to the configured `initialValue` — meaning corrupted localStorage never reaches React state.

2. **`deriveSentenceState` in `SentenceHeader.tsx` uses a 5% tolerance for tied-category detection.** When the runner-up category's spend is within 5% of the leader's (`topAmount - secondAmount < topAmount * 0.05`), the function returns `{ kind: 'tied' }` and the sentence renders "spread evenly" instead of "mostly on X."

3. **`useCategoryTotals` in `analytics.ts` lists both `filtered` and `timeframe` in its `useMemo` dependency array.** This means the category-donut aggregation recomputes directly whenever the user clicks between This Week, Last Week, and All Time — it does not depend on an upstream hook to trigger the recalculation.

4. **`handleDelete` in `App.tsx` performs an optimistic removal.** It immediately filters the expense out of state via `prev.filter()`, stashes the full `Expense` object in a separate `recentlyDeleted` state variable, and renders an `UndoToast` component with a 5-second window — if the user clicks Undo, the expense is prepended back into the array and `recentlyDeleted` is cleared. 

5. **`filterByTimeframe` is a pure function — for the `'all-time'` case it returns the original `expenses` array reference unchanged.** Unlike the `'this-week'` and `'last-week'` branches which each produce a new array via `.filter()`, the `'all-time'` branch simply passes through the same reference without creating a copy.

---
*Waiting for Human Audit...*

## Human Verdict

**Selected: Statement 2**

> I picked statement 2 because the 5% tolerance felt too specific — like something you'd invent to sound technical. I figured the actual threshold was simpler, maybe exact equality between the top two categories. A percentage-based tiebreaker on financial data also seemed like it could produce false ties if a user's spending pattern was genuinely lopsided. Something about it just felt *inserted*.

## Gamemaster Judgment

**Incorrect. Statement 2 is true.**

The 5% threshold is real and sits at `SentenceHeader.tsx:58`:

```ts
if (second && top[1] - second[1] < top[1] * 0.05) {
  return { kind: 'tied', amount: total, timeframe }
}
```

The tolerance exists for exactly the reason you intuited — without it, two categories at $50.01 and $49.99 would declare a "mostly on X" when the difference is a rounding artifact. The 5% buffer is the designed fuzz factor.

**The actual lie was Statement 3.**

`useCategoryTotals` in `analytics.ts:54-62` declares only `[filtered]` in its `useMemo` dependency array — not `[filtered, timeframe]`. The hook does not reference `timeframe` at all. It recalculates when the user switches timeframes because `useFilteredExpenses` upstream produces a new `filtered` array reference, triggering a fresh derivation. The hook itself is timeframe-agnostic.

The bait worked because it's *almost* true — the practical effect is identical. But `useMemo` doesn't know about `timeframe`; it only knows about `filtered`. That's the architecture: each hook depends on the narrowest slice of data it actually consumes.
