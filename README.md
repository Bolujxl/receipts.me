# receipts.me

**A calm, sentence-driven spending dashboard. No accounts, no sync, no noise. Just your money, in a sentence.**

![Screenshot of receipts.me dashboard showing $785.00 out this week, mostly on transport, with donut chart, bar chart, expense list, and budget editor](public/screenshot.png)

---

## What It Does

Type in what you spent. The app reads it back to you as a sentence:

> **$785.00** out this **week**, mostly on **transport**.  
> ↑ $142.00 from last week  
> 62% of monthly budget

Charts show you the breakdown. A list shows every entry. Everything saves to your browser — no accounts, no servers, no one watching.

---

## Features

- **Sentence-driven dashboard** — your spending rendered as a single editorial sentence, not a grid of KPI cards
- **Donut chart** — spending by category, with last-week comparison ring and budget overlay ring
- **Bar chart** — 7-day daily trend with an average reference line
- **4-week sparkline** — weekly totals at a glance: rising, falling, or steady
- **9 categories** — food, transport, housing, bills, health, shopping, fun, data, other — each with a distinct color
- **3 timeframes** — this week, last week, all time — switch by clicking the timeframe word in the sentence
- **Filter by category** — tap a category in the list to drill down; tap again to clear
- **Edit & delete** — click any expense row to open an edit modal; delete with 5-second undo safety net
- **Monthly budgets** — set per-category caps; the donut shows how much of each budget you've used
- **Trend delta** — sentence shows ↑ or ↓ compared to last week
- **Export / Import** — backup your data as JSON; restore it anytime
- **Light + dark mode** — follows your system preference automatically; no toggle
- **Works offline** — all data in localStorage; no internet required
- **Mobile-friendly** — responsive 2×2 grid → single-column stack; tap-to-pin tooltips on charts
- **Accessible** — ARIA roles, keyboard navigation, focus rings, reduced-motion support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript (strict) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (design tokens via `@theme`) |
| Charts | Recharts 3 |
| Validation | Zod |
| Persistence | localStorage (custom `useLocalStorage` hook) |
| Fonts | Inter (UI), IBM Plex Mono (numbers) |

**Zero runtime dependencies beyond React + Recharts + Zod.** No state management library, no router, no CSS framework beyond Tailwind, no backend.

---

## Architecture

### Data Flow

```
useLocalStorage('receipts_data')  ←→  localStorage
        │
        ▼
    [expenses]                     single source of truth
        │
        ├── useFilteredExpenses() → [filtered]     derived state (by timeframe)
        │       │
        │       ├── useCategoryTotals()  → donut data
        │       ├── useDailyTotals()     → bar chart data (O(n) pre-bucketed)
        │       ├── useLastWeekCategoryTotals() → comparison ring
        │       ├── useWeeklyTrend()     → sparkline data
        │       └── deriveSentenceState() → sentence variant + delta + budget %
        │
        └── ExpenseEditModal → edit/delete with optimistic undo
```

### Key Principles

- **Single source of truth** — `expenses` is the only state variable holding financial data; everything else is derived
- **Integer-cents math** — all amounts stored as integers (`amountCents: 1999` = $19.99), eliminating IEEE 754 drift
- **Immutable updates** — `.filter()`, `.map()`, spread syntax; no mutations anywhere
- **Pure filtering** — `filterByTimeframe()` is referentially transparent
- **Derived state via `useMemo`** — chart data, totals, sentence state all recomputed only when dependencies change
- **Zod validation at the persistence boundary** — corrupted localStorage is rejected, not rendered

---

## Project Structure

```
src/
├── main.tsx                    Entry point
├── App.tsx                     Root component, CRUD callbacks, layout composition
├── types.ts                    Category, Expense, Timeframe types
├── analytics.ts                Pure filtering + data transformation hooks
├── useLocalStorage.ts          Generic localStorage hook with optional validator
├── index.css                   Tailwind v4 @theme + @keyframes
│
├── components/
│   ├── CornerMark.tsx           Logo + wordmark (adaptive <picture> for light/dark)
│   ├── SentenceHeader.tsx       Sentence-driven headline + timeframe dropdown
│   ├── TimeframeDropdown.tsx    Floating menu with keyboard navigation
│   ├── ExpenseForm.tsx          Add expense form
│   ├── ExpenseEditModal.tsx     Edit/delete modal
│   ├── DonutCard.tsx            Spend by category donut + budget ring
│   ├── BarCard.tsx              Daily trend bar chart + average line
│   ├── ListCard.tsx             Filterable expense list with category pills
│   ├── TrendLine.tsx            4-week spending sparkline
│   ├── UndoToast.tsx            5-second undo toast for deletes
│   ├── BudgetEditor.tsx         Per-category monthly budget editor
│   └── EmptyState.tsx           Empty-state placeholder
│
├── lib/
│   ├── constants.ts             Shared CATEGORY_COLORS map
│   ├── format.ts                formatCents(), formatDate(), validateExpenseInput()
│   └── validation.ts            Zod schemas for Expense[]
│
└── styles/
    └── colors.css               CSS custom properties (dark + light mode)
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/Bolujxl/receipts.me.git
cd receipts.me

# Install
npm install

# Develop
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

Open `http://localhost:5173` in your browser. No environment variables, no API keys, no database. It just works.

---

## Design System

### Brand
- **Primary accent:** Sage `#7C9F3F` — calm, confident, distinct from generic fintech blue
- **Surface palette:** Cool zinc grays (inverted for light mode)
- **Typography:** Inter for text, IBM Plex Mono for numbers — never `tabular-nums`, never mixed
- **No emoji, no exclamation marks, no "fun" copy.** The voice is editorial and quiet.

### Category Colors

| Category | Color | Hex |
|---|---|---|
| food | rose | `#9F1239` |
| transport | cobalt | `#1E40AF` |
| housing | teal | `#0F766E` |
| bills | slate | `#475569` |
| health | emerald | `#047857` |
| shopping | sky | `#0369A1` |
| fun | amber | `#A16207` |
| data | violet | `#5B21B6` |
| other | zinc | `#52525B` |

All at -700/-800 saturation weight. Chosen for distinctness under both normal vision and common colorblindness simulations. Shopping was moved from pink to sky during the accessibility audit to eliminate the rose/pink collision under protanopia/deuteranopia.

### Light/Dark Mode

The app follows `prefers-color-scheme` automatically. No toggle, no preference stored. The brand sage and category colors stay identical between modes; only the surface and text tokens invert. Implementation is pure CSS (`@media` query on `:root` custom properties) + an adaptive SVG favicon and `<picture>` element for the logo.

---

## Documentation

- `docs/01-explanation.md` — "How It Works: The Journey of a Receipt" (ELI7 + line-by-line walkthrough)
- `docs/02-principles.md` — Architectural Principles Audit (5 patterns with code references)
- `docs/03-audit.md` — Edge-Case & Defensive Architecture Audit (5 vectors)
- `docs/04-cross-check.md` — Algorithmic Cross-Check (floating-point, tooltip mismatch, complexity)
- `docs/05-tinker.md` — Tinker Log: seeding 50 expenses into the 2×2 grid
- `docs/06-lie-detector.md` — Adversarial Architecture Game (4 truths + 1 lie)
- `docs/07-code-review.md` — Staff Engineer Code Review + Light/Dark Mode specification
- `docs/08-roadmap.md` — Phase 1-10 roadmap (5 complete, 3 proposed, 2 axed)

---

## License

MIT
