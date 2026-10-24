# DESIGN.md — Earnings Calendar UI

Source of truth for all UI work. Reference mock: `design/mock-home.dc.html` (HTML prototype; read it for exact values and sample data — do not copy its runtime/`<x-dc>` syntax, rebuild in React).

Stack: Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Recharts.

---

## 1. Design principles

- **The calendar is the product.** Home = month grid. No KPI cards, news, or extra widgets on the first screen.
- **Paper, ink, hairlines.** Cream background, near-black ink, 1px low-contrast rules. Structure comes from lines, not shadows or cards.
- **Square by default.** Buttons, tags, panels, inputs: `border-radius: 0`. Only ticker tiles are rounded (10px), like app icons.
- **Mono for metadata.** Every label, button, tag, date and nav item is uppercase Geist Mono. Prose is Inter. Titles are Bricolage Grotesque.
- **Color is information.** Green/amber/red only for beat/mixed/miss. Blue only for the one emphasized title word and links. Number badges are the only decorative color.
- **5-second test:** who reports today/this week, who beat or missed, how one company did vs. estimates.

---

## 2. Tokens

### Colors

| Token | Light (default) | Dark | Use |
|---|---|---|---|
| `bg` | `#f2f1ee` | `#0b0b0c` | Page, panels |
| `bg-past` | `#efeeea` | `#0d0d0f` | Calendar cells before today |
| `bg-today` | `#e9e8e4` | `#17171a` | Today's cell |
| `tile` | `#ffffff` | `#141417` | Ticker tiles |
| `tag` | `#e9e8e4` | `#18181b` | Tag fill |
| `ink` | `#101014` | `#f2f1ee` | Primary text, solid buttons |
| `strong` | `#000000` | `#ffffff` | Titles, tickers |
| `body` | `rgba(16,16,20,.72)` | `rgba(242,241,238,.75)` | Paragraphs |
| `muted` | `rgba(16,16,20,.60)` | `rgba(242,241,238,.60)` | Labels, counts |
| `line` | `rgba(16,16,20,.16)` | `rgba(242,241,238,.16)` | All rules/borders |
| `line-strong` | `rgba(16,16,20,.40)` | `rgba(242,241,238,.40)` | Outline buttons, dashed "+N" |
| `blue` | `#1a5bc4` | `#6aa0ff` | Accent word, links |
| `beat` | `#1d7a4c` | `#2fd39c` | Beat, positive surprise |
| `mixed` | `#8f5a00` | `#ffb347` | Mixed result |
| `miss` | `#b83a24` | `#ff7a63` | Miss, negative surprise |
| `scrim` | `rgba(16,16,20,.25)` | `rgba(0,0,0,.55)` | Behind slide-over |

Number-badge fills (white text, same in both themes, slightly deeper in dark):
`#2d6fe0` blue · `#e0503a` red · `#7a4ff0` purple · `#e9a51e` amber · `#1e9c6a` green. Used in order 01→05 (Mon→Fri headers).

### Typography

| Role | Font | Size / weight | Tracking | Case |
|---|---|---|---|---|
| Display (page title) | Bricolage Grotesque | 56px / 700, line-height 1.02 | -0.04em | Sentence |
| Panel title (company name) | Bricolage Grotesque | 34px / 700, lh 1.02 | -0.04em | — |
| Big number (EPS, revenue) | Bricolage Grotesque | 32px / 700, lh 1.05 | -0.04em | — |
| HUD label / section bar / nav | Geist Mono | 11px / 500 | 0.15em | UPPER |
| Button | Geist Mono | 11px / 700 | 0.12em | UPPER |
| Tag | Geist Mono | 10px / 500 | 0.10em | UPPER |
| Ticker in tile | Geist Mono | 12px (4 chars: 11px, 5+: 10px) / 700 | 0.02em | UPPER |
| Body | Inter | 15px / 400, lh 1.5 | normal | — |
| Small body | Inter | 13px / 400 | normal | — |

Load with `next/font/google`: `Bricolage_Grotesque` (weights 400–800), `Geist_Mono` (400–700), `Inter` (400–600). Expose as CSS vars `--font-display`, `--font-mono`, `--font-sans`.

### Spacing, radius, size

- Base unit 4px. Page gutter 24px. Section bar padding `10px 24px`.
- Content frame: `max-width: 1200px`, centered, `border-left` + `border-right` 1px `line`.
- Radius: `0` everywhere; ticker tiles `10px`.
- Control height: 40px (buttons, segmented controls); header 44px.
- Ticker tile 48×48, gap 6px, 4 per row.
- Shadows: none, except tile `0 1px 0 rgba(16,16,20,.06)` in light.

---

## 3. Tailwind v4 theme (`app/globals.css`)

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --bg: #f2f1ee; --bg-past: #efeeea; --bg-today: #e9e8e4;
  --tile: #ffffff; --tag: #e9e8e4;
  --ink: #101014; --strong: #000000;
  --body: rgb(16 16 20 / .72); --muted: rgb(16 16 20 / .60);
  --line: rgb(16 16 20 / .16); --line-strong: rgb(16 16 20 / .40);
  --blue: #1a5bc4; --beat: #1d7a4c; --mixed: #8f5a00; --miss: #b83a24;
  --scrim: rgb(16 16 20 / .25);
}
.dark {
  --bg: #0b0b0c; --bg-past: #0d0d0f; --bg-today: #17171a;
  --tile: #141417; --tag: #18181b;
  --ink: #f2f1ee; --strong: #ffffff;
  --body: rgb(242 241 238 / .75); --muted: rgb(242 241 238 / .60);
  --line: rgb(242 241 238 / .16); --line-strong: rgb(242 241 238 / .40);
  --blue: #6aa0ff; --beat: #2fd39c; --mixed: #ffb347; --miss: #ff7a63;
  --scrim: rgb(0 0 0 / .55);
}

@theme inline {
  --color-bg: var(--bg); --color-bg-past: var(--bg-past); --color-bg-today: var(--bg-today);
  --color-tile: var(--tile); --color-tag: var(--tag);
  --color-ink: var(--ink); --color-strong: var(--strong);
  --color-body: var(--body); --color-muted: var(--muted);
  --color-line: var(--line); --color-line-strong: var(--line-strong);
  --color-blue: var(--blue); --color-beat: var(--beat); --color-mixed: var(--mixed); --color-miss: var(--miss);
  --color-scrim: var(--scrim);
  --color-badge-1: #2d6fe0; --color-badge-2: #e0503a; --color-badge-3: #7a4ff0;
  --color-badge-4: #e9a51e; --color-badge-5: #1e9c6a;

  --font-display: var(--font-bricolage), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-sans: var(--font-inter), system-ui, sans-serif;

  --radius-tile: 10px;
}

@utility hud { font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: .15em; text-transform: uppercase; }
@utility btn-label { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
@utility tag-label { font-family: var(--font-mono); font-size: 10px; font-weight: 500; letter-spacing: .10em; text-transform: uppercase; }
@utility display { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.04em; line-height: 1.02; }

body { background: var(--bg); color: var(--ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
```

shadcn/ui: set `--radius: 0rem` and map shadcn's `--background/--foreground/--border` to the tokens above, so its primitives (Sheet, Popover, Command, Tooltip) inherit the look. Use shadcn for behaviour; restyle every surface to these tokens.

---

## 4. Components

| Component | Spec |
|---|---|
| **TopBar** | 44px, bottom rule. Left: 52px logo cell with right rule. Nav: mono `hud`, active item = solid `ink` bg + `bg` text, padding `4px 10px`. Right: search (mono placeholder "SEARCH TICKER", left rule), theme toggle 48px cell with left rule. |
| **SectionBar** | Full-width row, `py-2.5 px-6`, top/bottom rule, `hud` in `muted`. Left: `01 / <span ink>TITLE</span>`. Right: context note. |
| **PageTitle** | `display` 56px; one emphasized word in `blue`, ends with a period: "October **earnings**." |
| **Button** | 40px, `btn-label`, square. Primary: `bg-ink text-bg`. Secondary: `border border-line-strong text-ink`. Adjacent buttons merge borders (`-ml-px`). |
| **SegmentedControl** | Row of secondary buttons; selected = primary style. Used for All/Watchlist and List/Week/Month. |
| **NumberBadge** | `hud` text, white on badge color, `px-2 py-0.5`, e.g. `01`. |
| **Tag** | `tag-label`, `bg-tag border border-line px-1.5 py-px`; text color = meaning (`beat`/`mixed`/`miss`/`muted`). |
| **TickerTile** | 48×48 `<button>`, `bg-tile border-line rounded-tile`, mono ticker. Reported: 10×10 square marker top-right (offset -4px) in status color with 2px border matching cell bg. Upcoming: no marker. Later: swap ticker text for logo image, same box. Dimmed (filtered out): `opacity .18`. |
| **DayCell** | `min-h-40`, `px-4 pt-3.5 pb-4`, right + bottom rule. Header row: date `OCT 19` (hud) left, count `07` (muted) right. Past = `bg-past`, today = `bg-today` + label as inverted chip `OCT 19 · TODAY`. Max 8 tiles; if more, 7 tiles + dashed `+N` tile. Empty: `NO EARNINGS` tag. |
| **MonthGrid** | 5 columns (Mon–Fri only), header row with `NumberBadge` + weekday. Wrap in `overflow-x-auto`, `min-w-[900px]`. |
| **Legend** | Row of Tags: Beat, Mixed, Miss, "No mark · upcoming". |
| **DetailsSheet** | Right slide-over (shadcn `Sheet`), `w-[min(460px,100%)]`, full-screen on mobile. `bg-bg`, left rule, scrim behind. Sections separated by rules, no cards: (1) SectionBar `03 / Q3 2026 RESULTS` + 48px close cell; (2) ticker badge + sector, company name (display 34px), "Reported Oct 19, after market close." tags: status, `ADJUSTED EPS`, `BMO/AMC`; (3) 2-col stat grid with a rule between: label, big number, "vs. $X expected", surprise `+4.0% SURPRISE` in status color; (4) EPS-surprise bar chart, 8 quarters, bars up/down from an `ink` zero line, square bars 14px wide, value labels above; (5) Primary button "Earnings release ↗", secondary "SEC filings ↗", footnote in muted 12px. |

Icons: lucide-react, 14px, stroke 2. No emoji.

---

## 5. Behaviour

- Default view: current month, today highlighted; week starts Monday, weekends hidden.
- Prev/Today/Next navigate months (Week view = same cell design, one row, taller cells, show all tiles).
- Search: filters by ticker prefix or company name. **Dims** non-matches instead of removing them, so the grid never reflows. A `+N` tile with matches inside gets a blue border and a count badge; with none, it dims. A drop-down under the search box lists every match in the month on any exchange (rows like the `+N` modal, with the date after the ticker).
- Watchlist toggle: dims non-watchlist tiles the same way. Add / remove with the "Add to watchlist" button in the DetailsSheet. Stored in `localStorage` for the MVP.
- Click tile → DetailsSheet. URL reflects selection (`?t=NFLX`) so it's shareable; `Esc` closes.
- Status logic: Beat = EPS ≥ est and revenue ≥ est; Miss = both below; Mixed = one each; Upcoming = not yet reported. Only compute surprise when estimate and actual share an accounting basis (adjusted vs. GAAP).
- Theme: light default, toggle in top bar, `class="dark"` on `<html>`, persisted in `localStorage`, respects `prefers-color-scheme` on first visit.
- Accessibility: tiles are `<button>` with `aria-label="NFLX · Netflix · Beat"`; color is never the only signal (marker + tag text); visible focus ring `2px solid var(--blue)` offset 2px.
- Responsive: ≥1024px full grid; below, the grid scrolls horizontally inside its frame; <640px switch to a day-by-day list (date header + horizontal tile rows) and the sheet goes full-screen.

---

## 6. Suggested file structure

```
app/
  layout.tsx            fonts, ThemeProvider
  page.tsx              month view (server component, fetch/mock)
  globals.css           tokens (section 3)
components/
  top-bar.tsx  section-bar.tsx  page-title.tsx
  ui/button.tsx  ui/tag.tsx  number-badge.tsx
  calendar/month-grid.tsx  calendar/day-cell.tsx  calendar/ticker-tile.tsx  calendar/legend.tsx
  details/details-sheet.tsx  details/stat-block.tsx  details/surprise-chart.tsx
lib/
  types.ts              Company, EarningsEvent, EarningsResult, Status
  status.ts             getStatus(), surprisePct()
  mock-earnings.ts      sample month (copy data from design/mock-home.dc.html: names() and month())
  watchlist.ts          localStorage hook
```

## 7. Build order

1. Tokens + fonts + `globals.css`, verify light/dark toggle.
2. TopBar, SectionBar, PageTitle, Button, Tag, NumberBadge.
3. TickerTile → DayCell → MonthGrid with mock data. Match the mock side by side.
4. DetailsSheet + surprise chart.
5. Search, watchlist, URL state, responsive list view.
