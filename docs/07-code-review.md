# Staff Engineer Code Review — receipts.me

A critical read of the entire codebase: logic, architecture, UI decisions, accessibility, and AI-generation tells.

---

## 1. Logic

**The good.** The integer-cents data model (`amountCents`) with `Math.round` at the input boundary and `/100` at the display boundary is correct. IEEE 754 drift is impossible inside the pipeline. `deriveSentenceState` is a pure, testable function with a sensible 5% tiebreaker — the kind of thing a human actually thought about. `filterByTimeframe` is referentially transparent. The optimistic delete + undo toast is the right pattern; no confirmation modals polluting the flow.

**The bad.** `todayISO` in both `ExpenseForm.tsx:9` and `ExpenseEditModal.tsx:12` is computed at module load time. Keep the app open past midnight and the "no future dates" validation uses a stale ceiling. This should be computed at call time inside `handleSubmit` / `handleSave`. Low-probability bug, but it's a time bomb that costs two lines to fix.

`useDailyTotals` in `analytics.ts:64-98` runs a nested `filter().reduce()` for each of 7 days — O(7n) where one O(n) pass would suffice by pre-bucketing into a `Map<string, { total, byCategory }>`. The TODO on line 65 acknowledges this. It has survived 6 stages of refactoring. At 50 expenses it doesn't matter. At 5,000 it will.

`CATEGORY_COLORS` is defined identically in **four files**: `SentenceHeader.tsx:6-16`, `DonutCard.tsx:6-16`, `BarCard.tsx:6-16`, `ListCard.tsx:4-14`. Adding a category means touching 7 files (these four + `types.ts` + `colors.css` + `index.css`). Every one of these was written by the AI at different stages with the instruction "keep it inline for now." The "for now" never ended. Extract to `src/lib/constants.ts`.

The `SentenceHeader` defines `TimeframeWord` and `CategoryWord` as **inner components** inside the render body (lines 99-118). This means React unmounts and remounts them on every render because the function identity changes. It works — the DOM output is the same — but it defeats React's reconciliation and is a well-known anti-pattern. Move them to module scope or just inline the JSX.

---

## 2. Architecture & Principles

**The good.** Single source of truth (`useLocalStorage` → `expenses` → `filtered` → chart data). Unidirectional. Every derived value is a chain of `useMemo` hooks with explicit dependencies. No component has its own copy of the expense array. This is disciplined.

`useLocalStorage` accepting a `validator` parameter is a clean extension point. The zod schema at `validation.ts` is minimal and correct. The try/catch on `localStorage.setItem` means the app degrades gracefully when storage is full or blocked.

**The bad.** The validator only runs on **initial hydration** (`useState` initializer at `useLocalStorage.ts:8-25`). After that, `setExpenses` writes to localStorage without re-validating. If a future feature (or a bug) calls `setExpenses` with invalid data — an expense with `amountCents: NaN`, a category outside the enum — it persists silently. The validator is a doorman who checks IDs at the front gate but waves everyone through once they're inside. Either validate on every `setExpenses` call or accept that the type system is the only guard at write time and the zod check at read time is recovery, not prevention.

`useLocalStorage`'s `set` callback has an **empty dependency array** (`useCallback.ts:35-37`). This means the callback never updates. It calls `setValue` (the `useState` setter) which is stable by React's guarantee. This works, but it's fragile — if `setValue` ever needed to depend on external state (it doesn't), you'd have a stale closure. A comment explaining *why* `[]` is correct would make this less mysterious.

`SentenceHeader` receives both `allExpenses` and `filtered` as props and derives sentence state from them. This is correct — the component doesn't know that `filtered` is a subset of `allExpenses` produced by `useFilteredExpenses`. But it also receives `timeframe` separately, which means the prop interface exposes implementation details. The component needs `filtered` (for totals/categories) and `allExpenses` (for the `no-expenses` check), but `timeframe` is only used for the dropdown label and the "this week" vs "last week" verb tense. Consider whether `timeframe` should be derived from context rather than passed explicitly — or just accept that at 3 props it's fine.

The `handleTimeframeClick` in `SentenceHeader.tsx:95-97` captures a DOMRect and passes it to the dropdown for `position: fixed` anchoring. This is a hand-rolled popover. It works at the current scope. At any larger scope — viewport resizes, scroll positions, the trigger word moving due to a text reflow — the dropdown stays pinned to where the button *was*, not where it *is*. A proper floating UI library would handle this. For now, it's fine at receipt.me's scale, but the tech debt is real.

---

## 3. UI / UX

**The good.** The sentence header is the strongest piece of design in the app. "You've spent $785.00 out this week, mostly on transport." reads as editorial copy, not dashboard UI. The 5% tie threshold means the app admits "spread evenly" when data is ambiguous — this is honest design. The sticky header band with backdrop blur is restrained and functional. The undo toast (5-second window, single-action) is the correct delete confirmation pattern — no dialog, no friction, recoverable.

**The questionable.** The "Add Expense" button resets the category dropdown to 'food' after every submit (`ExpenseForm.tsx:47`). If you're entering 5 transport expenses in a row, you re-select transport 5 times. A sticky-category preference (keep the last-used category) would be a small but meaningful quality-of-life improvement. The current behavior is correct for the "first expense" default but wrong for batch entry.

The 2×2 grid at desktop has no visual hierarchy between cards. The form card (~380px) sits next to the donut card (~620px) with no attempt to bridge the height gap. The prompt says "this is correct — unequal heights are intentional." It's honest, but it means the grid reads as four independent boxes rather than a composed dashboard. A subtle connecting element — a shared top border, a consistent header treatment, a unified background — would make it feel designed rather than assembled.

The list card shows entry count as "12 entries" in Plex Mono, top-right. Useful. But there's no way to sort, filter, or search the list. If you have 200 expenses, finding one is scrolling and squinting. This is a known gap (Stage 6 was supposed to be edit/delete, not search), but the list card now carries weight it wasn't designed for.

**The AI-slop tells.** "Your expenses will appear here" in `ListCard.tsx:47` is placeholder copy that survived to production. It's grammatically correct but emotionally flat — it reads as UI boilerplate, not as a brand voice. The sentence header speaks to the user; the list card empty state fills space. Compare: "Add your first expense to see your spending take shape" (old EmptyState.tsx, now deleted) versus "Your expenses will appear here." One has a point of view. The other is lorem ipsum that learned English.

---

## 4. Accessibility

**The good.** The modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the heading. The close button has `aria-label="Close"`. The dropdown has `role="menu"` and `role="menuitem"`. The undo toast has `role="status"` and `aria-live="polite"`. List row swatches have `aria-hidden="true"`. Escape key handling exists in both the modal and the dropdown. This is more ARIA than most production apps ship.

**The bad.** The timeframe word `<button>` in `SentenceHeader.tsx:100-105` has no `aria-expanded` attribute to indicate whether the dropdown is open. A screen reader user pressing the button gets no feedback that a menu appeared. Fix: `aria-expanded={dropdownAnchor !== null}`.

The dropdown has no keyboard navigation beyond Escape. A proper menu should support Arrow Up/Down to move between items, Enter/Space to select, Home/End to jump to first/last. The `role="menu"` implies this behavior but the implementation doesn't deliver it. Screen reader users can Tab through the items but that's a list, not a menu interaction pattern.

The list card rows are `<button>` elements wrapping date, category, and amount text. A screen reader announcing this button will read "Fri, Jun 12 food $34.00" — which is all the information, but as one run-on string. An `aria-label` like `"Edit $34.00 food expense from June 12"` would be more scannable. The current approach is technically accessible (all text is visible) but pragmatically noisy.

The donut chart is an SVG with zero accessible alternative. Recharts provides no built-in description mechanism. Screen reader users hear nothing. The bar chart similarly has no text fallback. This is a Recharts limitation, not a receipts.me bug, but the sparse-data states ("Add an expense to see the breakdown") at least provide text when data is absent. When data is present, all meaning is purely visual.

Color is the only differentiator for categories. Food (rose) and shopping (pink) are adjacent hues that fail common colorblindness simulations (protanopia/deuteranopia merge them into similar muddy tones). The Stage 7 prompt acknowledged this as "acceptable trade-off given color budget" and deferred any fix. The trade-off is documented, at least, but the accessibility gap is real for ~8% of male users.

---

## 5. What Reads as "AI Slop"

This codebase was generated iteratively by an LLM across 10+ stages. The following patterns are tells:

**1. The TODO graveyard.** `analytics.ts:65` has `// TODO [Audit 03 §3 / Cross-check B]: pre-bucket expenses by date`. It's been there since Stage 4. The LLM identified the performance issue, wrote a comment about it, and moved on. Six stages later, 50 expenses later, the O(7n) loop is still there. An AI will happily write TODOs forever; it won't circle back to action them unless explicitly told to.

**2. Copy-paste constants.** `CATEGORY_COLORS` defined identically in 4 files. At each stage, the LLM was told "copy this inline for now." No stage ever said "consolidate these." The result is a maintenance vector that's fine at 5 categories and annoying at 9. At 15 it's a bug surface.

**3. Hyper-defensive edge case handling.** `crypto.randomUUID?.() ?? \`${Date.now()}-...\`` in `ExpenseForm.tsx:35` guards against a browser API with 96.8% global support (caniuse, June 2026). `formatCents` returns `'$0.00'` on NaN despite a zod validator that guarantees positive finite integers. The LLM adds defensive code for theoretical failures rather than trusting the pipeline it built. This isn't *wrong* — defensive coding is good — but the pattern is recognizable: the model doesn't trust its own output, so it double-checks at every boundary.

**4. Inline component definitions.** `TimeframeWord` and `CategoryWord` defined as functions inside `SentenceHeader`'s render body. The LLM does this because it's compositionally convenient — define the helper where you use it. A human engineer would either extract to module scope (because these don't depend on render-time state except props) or inline the JSX directly (because the abstraction isn't buying clarity). The middle ground — a function component defined *inside* another component — is a React anti-pattern that the LLM reaches for by default.

**5. Placeholder copy as production text.** "Your expenses will appear here." "Add an expense to see the breakdown." These are grammatically correct, contextually appropriate, and have zero personality. They're what you get when you ask an LLM "write placeholder text for an empty state." Compare to the sentence header's "Start tracking — your first expense unlocks the dashboard." One was designed; the other was generated.

**6. Validation logic duplication.** `ExpenseForm.tsx:20-29` and `ExpenseEditModal.tsx:48-56` contain near-identical validation (parseFloat, isNaN, positive check, future-date check, Math.round). The LLM implemented each form independently rather than extracting a shared `validateExpenseInput(amount: string, date: string, todayISO: string)` function. Two copies is manageable. A third (filters? bulk import?) would cross the line.

---

## 6. What Would Make This Better

1. **Extract `CATEGORY_COLORS` to `src/lib/constants.ts`.** One source of truth. Every component imports it. Adding a category touches `types.ts` + `colors.css` + `index.css` + `constants.ts` — 4 files, not 7.

2. **Extract form validation to a shared function.** `validateExpenseInput(amount: string, date: string) => { amountCents: number, error?: string }`. Called by both forms. Single bug-fix surface.

3. **Pre-bucket `useDailyTotals` to O(n).** The TODO has been sitting there long enough. One pass through `filtered` building a `Map<isoString, { total: number, byCategory: Map<Category, number> }>`, then a 7-iteration loop reading from the map. Not hard, just never prioritized.

4. **Add `aria-expanded` to the timeframe word button.** Two lines. Disproportionate accessibility impact.

5. **Add keyboard navigation to the dropdown.** Arrow keys, Home/End. The `role="menu"` contract demands it.

6. **Fix `todayISO` to compute at call time.** Move the `new Date().toLocaleDateString('en-CA')` inside the handler functions. Two lines per form. Eliminates the midnight bug.

7. **Give the list card rows an `aria-label`.** Something like `Edit ${formatCents(expense.amountCents)} ${expense.category} expense from ${formatDate(expense.date)}`. Screen readers get a scannable, meaningful announcement instead of a run-on of three text nodes.

8. **Give the card empty states some voice.** "Add an expense to see the breakdown" → "Add your first grocery run, rent payment, or commute." Same information, more character. The sentence header proves the app can do editorial voice; the card copy should match.

9. **Decide on `timeframe` prop threading.** Either pass it through explicitly (current approach — explicit, verbose, works) or put it in a React context (cleaner prop drilling, overkill for 3 components). Don't leave it in the current awkward state where `ListCard` receives `timeframe` but doesn't use it — the `timeframe` prop in `ListCard.tsx:18` is declared in the interface but never destructured. It's a dead prop waiting for a future feature.

---

## Bottom Line

This is a solid Stage 10 prototype written by an AI with a human steering. The architecture is sound — single source of truth, derived state, immutable updates, integer-cents financial math. The sentence header is genuinely good product design. The accessibility work is above average for a prototype. The bugs are real but fixable (midnight `todayISO`, O(7n) loop, missing `aria-expanded`). The tech debt is concentrated in duplication (`CATEGORY_COLORS` × 4, validation × 2) and deferred TODOs that an LLM will never action on its own. The "AI slop" is cosmetic rather than structural — placeholder copy, unnecessary defensiveness, an inline-component anti-pattern. None of it breaks anything. All of it makes the codebase read as what it is: a solo developer + a very fast, very obedient, slightly careless pair programmer.
