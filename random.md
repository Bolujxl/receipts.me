# Task: Sticky Header Band + Wordmark Bump + Remove Form Spacer

## Context
After the Stage 9 layout pass, the desktop layout is a 2×2 grid below a full-width sentence. Three issues remain:

1. **The CornerMark scrolls away with the page.** On viewports where the page is taller than the viewport (most laptops, all mobile), the brand identity disappears as the user scrolls down to see the bottom row of cards (List + Bar). Brand needs to stay visible.

2. **The wordmark next to the logo is undersized.** Currently `text-base` (16px) next to a 32px logo. The visual balance is off; the wordmark reads as a footnote rather than as part of the brand mark.

3. **The form card has a giant empty space.** Stage 9 added a `<div className="flex-1" />` spacer inside the form to push the Add Expense button to the bottom of the card, matching the donut card's height for visual alignment in the 2×2 grid. The intent was right, but the result is a 620px-tall form card with most of it being dead space between the date field and the button. The page scrolls *anyway* (the bottom row of cards doesn't fit in viewport), so the alignment hack stopped paying for itself.

This prompt addresses all three:
- Wraps CornerMark in a sticky header band with backdrop blur
- Bumps the wordmark to `text-xl` (20px)
- Removes the form spacer; lets the form be its natural compact height

The result: the page scrolls (we're accepting this — no-scroll was an aspirational target, not a hard requirement), but the brand identity stays visible via sticky header, and the form looks intentional rather than padded.

## What stays the same
- The sentence header position (still appears below the CornerMark band, scrolls with the page)
- The 2×2 card grid composition
- All component logic
- Brand tokens, fonts, palette
- The fact that the page sometimes scrolls — we're embracing this rather than fighting it

## What changes
- `CornerMark.tsx`: wordmark size bump from `text-base` (16px) to `text-xl` (20px)
- `App.tsx`: wraps CornerMark in a sticky header band with backdrop blur; adjusts spacing below
- `ExpenseForm.tsx`: removes the `<div className="flex-1" />` spacer and the `min-h-[300px] flex flex-col` constraints added in Stage 9. Form returns to its natural compact height.

## File changes

### `src/components/CornerMark.tsx`

```tsx
export default function CornerMark() {
  return (
    <div className="flex items-center gap-2 opacity-80">
      <img src="/logo-dark.svg" alt="" className="w-8 h-8" aria-hidden="true" />
      <span className="text-text-secondary text-xl font-medium tracking-tight">
        receipts.me
      </span>
    </div>
  )
}
```

**Two changes:**
- `text-base` → `text-xl` (16px → 20px) on the wordmark
- Logo stays at `w-8 h-8` (32px) — already set in Stage 9

Optional: tighten the gap between logo and wordmark from `gap-2` (8px) to `gap-2.5` (10px) since both elements are now larger. Use your judgment.

### `src/App.tsx`

Wrap the CornerMark in a sticky header band. The band sits at the top of the viewport with `position: sticky` and `top: 0`. It needs:
- Full-page-width visual presence (not just the content area)
- Backdrop blur so scrolled content behind it doesn't visually conflict
- A subtle background tint so the blur has something to work with
- Inner content that respects the page's max-width

```tsx
return (
  <>
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">

      {/* Sticky header band */}
      <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-md border-b border-bg-border/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <CornerMark />
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Sentence row (CornerMark removed from this block) */}
        <div className="mb-8 md:mb-10">
          <SentenceHeader
            allExpenses={expenses}
            filtered={filtered}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseForm onAdd={handleAdd} />
          <DonutCard filtered={filtered} hasData={expenses.length > 0} />
          <ListCard
            filtered={filtered}
            timeframe={timeframe}
            allExpenses={expenses}
            onRowClick={setEditingExpense}
          />
          <BarCard filtered={filtered} hasData={expenses.length > 0} />
        </div>

      </div>
    </div>

    <ExpenseEditModal {...} />
    {recentlyDeleted && <UndoToast {...} />}
  </>
)
```

**Critical details:**

1. **`<header>` element** — semantic HTML. Screen readers and SEO benefit from a landmark element.

2. **`sticky top-0 z-40`** — sticks at the top of the scroll context. `z-40` keeps it above page content but below the modal (`z-50`) and dropdown (`z-60`).

3. **`bg-bg-base/80 backdrop-blur-md`** — 80% opacity background of `bg-bg-base` (the deepest tone) plus medium backdrop blur. The combo: scrolled content blurs behind the header rather than appearing through it. The blur direction is correct — content scrolling behind the header gets desaturated, not the other way around.

4. **`border-b border-bg-border/40`** — a faint border at the bottom of the band. Subtle separator between header and content. 40% opacity so it doesn't read as a heavy line.

5. **Inner `max-w-6xl mx-auto px-4 md:px-6 py-4`** — the outer band is full-viewport-width (so the blur extends edge to edge), but the inner content respects the same max-width and padding as the main content area. This means the CornerMark aligns vertically with the sentence and the cards below.

6. **`py-4` on the inner container** — 16px vertical padding. Combined with the 32px logo height, the band is ~64px tall. Compact, doesn't dominate the viewport.

7. **CornerMark removed from the sentence row** — it now lives only in the sticky band. The sentence row's outer wrapper drops from `space-y-6 md:space-y-8` to no wrapper at all (just the SentenceHeader). The `mb-8 md:mb-10` margin handles spacing to the grid below.

### `src/components/ExpenseForm.tsx`

Stage 9 added three things to the form wrapper to make it match the donut card's height for grid alignment:
- `min-h-[300px]` (minimum height to match other cards)
- `flex flex-col` (so the spacer could work)
- `<div className="flex-1" />` between the date field and the submit button (the actual spacer)

**Remove all three.** The form should be its natural compact height (~380px). The 2×2 grid will have unequal card heights in the top row (form is shorter, donut is taller) — and that's correct. The grid was trying to fake alignment by padding the form, which produced visible empty space inside the form card. With this removed, the form looks intentional rather than padded.

The form's outer wrapper goes from:

```tsx
<form
  onSubmit={handleSubmit}
  className="bg-bg-surface border border-bg-border p-6 rounded-xl space-y-4 min-h-[300px] flex flex-col"
>
```

Back to:

```tsx
<form
  onSubmit={handleSubmit}
  className="bg-bg-surface border border-bg-border p-6 rounded-xl space-y-4"
>
```

And the `<div className="flex-1" />` element between the date input and the submit button is deleted entirely.

**Visual consequence:** in the 2×2 grid's top row, the form card (~380px tall) sits next to the donut card (~620px tall). Unequal heights, top-aligned. This is the correct outcome — the form is what it is, the donut is what it is, neither pretends to match the other. The bottom row (List + Bar) cards have similar natural heights and will appear better matched, but that's coincidence, not enforcement.

## Hard rules

- **No new dependencies.** Sticky behavior uses native CSS, no library.
- **Header is `<header>` semantically.** Not a `<div>`.
- **z-index: 40 for the sticky band**, leaving 50 for the modal and 60 for the dropdown. Don't override.
- **The CornerMark only appears in the sticky band.** Don't render it twice. It's removed from the sentence row.
- **Backdrop blur direction matters.** Background of the header is the dark base color at 80% opacity. The blur applies to what's *behind* the header (scrolled page content). The header itself reads as a calm dark band, not a transparent overlay.
- **The header doesn't get any new content.** Just the CornerMark. No total, no nav, no search. We discussed and rejected adding the total.
- **The form spacer is deleted entirely, not commented out.** `min-h-[300px]`, `flex flex-col`, and `<div className="flex-1" />` are all removed from `ExpenseForm.tsx`. The form returns to its natural height.
- **Don't add the spacer back via a different mechanism.** No `min-height` on the form, no `align-self: stretch` on the grid cell, no `grid-auto-rows: 1fr`. Unequal card heights are intentional.

## Acceptance criteria

### Sticky behavior
- [ ] On page load, CornerMark visible at top of viewport inside a header band
- [ ] Scrolling the page: header band stays fixed at the top of the viewport
- [ ] Header band extends edge to edge horizontally (full viewport width)
- [ ] Inner content (CornerMark) aligns with the page's max-w-6xl content area
- [ ] At small viewports (mobile), header stays sticky and CornerMark stays in the top-left

### Visual
- [ ] Wordmark is `text-xl` (20px), matches the visual weight of the 32px logo
- [ ] Header band has a subtle backdrop blur — scrolled content visible but desaturated behind it
- [ ] Faint bottom border separates header from content
- [ ] No visual flicker when scrolling starts/stops
- [ ] Header band reads as part of the brand, not as a heavy overlay

### Form (spacer removed)
- [ ] No empty space inside the form card between the date field and the Add Expense button
- [ ] Form card height matches its natural content (~380px), not stretched to match the donut
- [ ] In the 2×2 grid, the form card is visibly shorter than the donut card — this is correct
- [ ] Form still functions: adds expenses, validates positive amounts, blocks future dates

### Stacking order
- [ ] Modal opens *above* the sticky header (z-50 > z-40)
- [ ] Timeframe dropdown opens *above* the sticky header (z-60 > z-40)
- [ ] Undo toast appears *above* the sticky header (z-50 > z-40)
- [ ] No z-index conflicts cause anything to appear behind the header band

### Build hygiene
- [ ] `npm run build` clean, no TypeScript errors
- [ ] No console warnings
- [ ] All existing functionality preserved (sentence dropdown, form, modal, undo, etc.)

## Process

1. **Read** the current state of: `src/App.tsx`, `src/components/CornerMark.tsx`, `src/components/ExpenseForm.tsx`. Confirm the current composition (Stage 9 layout).

2. **Pause briefly to confirm:**
   - The current z-index values for modal, dropdown, and undo toast (should be 50, 60, 50 respectively — verify before setting header to 40)
   - That CornerMark is currently imported and rendered inside App.tsx (Stage 9 wrapped it in the sentence row)
   - The Tailwind v4 / `@theme` setup is in place so `backdrop-blur-md` works (it should — it's a Tailwind core utility, not a custom token)
   - That `ExpenseForm.tsx` has the Stage 9 additions (`min-h-[300px] flex flex-col` on the form wrapper, plus a `<div className="flex-1" />` before the submit button) — flag if these are not present
   - No other component currently uses sticky positioning that could conflict
   **Quick pause for confirmation before editing.**

3. **Apply changes in order:**
   - `src/components/ExpenseForm.tsx` — remove `min-h-[300px]`, `flex flex-col`, and the `<div className="flex-1" />` spacer
   - `src/components/CornerMark.tsx` — wordmark `text-xl`
   - `src/App.tsx` — wrap CornerMark in sticky header, remove from sentence row, adjust spacing

4. **Verify:**
   - Resize browser to a height where the page must scroll (e.g., 800px tall)
   - Scroll — CornerMark stays at top
   - Open the modal — modal appears above the header
   - Open the timeframe dropdown — dropdown appears above the header
   - Delete an expense — undo toast appears bottom-right, not obscured
   - Resize to mobile (375px) — header still sticky, CornerMark still visible
   - Check the form card: no empty space between date field and Add Expense button
   - Check the 2×2 grid top row: form card shorter than donut card, top-aligned
   - `npm run build` clean

Start with step 1. Brief pause at step 2. Then apply.