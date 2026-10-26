// Shapes Finnhub earnings-calendar rows into the month grid and details panel.
// Pure helpers only: safe to import from server and client components.

import { POPULAR_TICKERS } from "./popular";

export const DEFAULT_WATCHLIST = ["NFLX", "TSLA", "NOW", "AAPL", "MSFT", "JPM", "IBM"];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Filter options in display order; the first one is the default.
// An option picks companies by ticker list (`symbols`) or by exchange (`mic`); neither = all.
// `note` finishes "N companies …" above the grid.
export const EXCHANGES = [
  { key: "popular", label: "Most popular", symbols: POPULAR_TICKERS, note: "in Most popular" },
  { key: "nyse", label: "NYSE", mic: "XNYS", note: "on NYSE" },
  { key: "nasdaq", label: "Nasdaq", mic: "XNAS", note: "on Nasdaq" },
  { key: "all", label: "All", mic: null, note: null },
];

const DEFAULT_EXCHANGE = EXCHANGES[0];
const ALL_EXCHANGES = EXCHANGES.find((e) => e.key === "all");

function inOption(option, symbol, mic) {
  if (option.symbols) return option.symbols.has(symbol);
  return !option.mic || mic === option.mic;
}

export function parseExchange(value) {
  return EXCHANGES.find((e) => e.key === value) ?? DEFAULT_EXCHANGE;
}

// The default exchange stays out of the URL
function exchangeParam(exchange) {
  return exchange === DEFAULT_EXCHANGE ? null : exchange.key;
}

function calendarHref(params) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString();
  return query ? `/?${query}` : "/";
}

const TIMING = {
  bmo: { tag: "BMO", label: "before market open" },
  amc: { tag: "AMC", label: "after market close" },
  dmh: { tag: "DMH", label: "during market hours" },
};

// ISO "YYYY-MM-DD" date helpers, all in UTC so nothing drifts across time zones

function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function daysBetween(from, to) {
  return Math.round((parseIso(to) - parseIso(from)) / 86_400_000);
}

function shortLabel(iso) {
  return `${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${Number(iso.slice(8))}`;
}

// Today's date on Wall Street, which decides "today" and the default month
export function todayInNewYork() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export function monthKey({ year, month }) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year: Number(match[1]), month } : null;
}

export function shiftMonth({ year, month }, delta) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

// Calendar layouts: one day, one Monday–Friday week, or the whole month (default, kept out of the URL)
export const VIEW_MODES = ["day", "week", "month"];

export function parseViewMode(value) {
  return VIEW_MODES.includes(value) ? value : "month";
}

// "YYYY-MM-DD" that is a real date, else null
export function parseDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return null;
  return toIso(parseIso(value)) === value ? value : null;
}

// Weekends move on to the following Monday: the next day with earnings
export function weekdayOf(iso) {
  const dow = parseIso(iso).getUTCDay();
  return dow === 6 ? addDays(iso, 2) : dow === 0 ? addDays(iso, 1) : iso;
}

export function monthOf(iso) {
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) };
}

// Monday of a weekday's week
function mondayOf(iso) {
  return addDays(iso, 1 - parseIso(iso).getUTCDay());
}

// Next (+1) or previous (-1) weekday
function shiftWeekday(iso, delta) {
  let next = addDays(iso, delta);
  while ([0, 6].includes(parseIso(next).getUTCDay())) next = addDays(next, delta);
  return next;
}

// Monday–Friday range that covers every weekday of the month
export function monthGridRange({ year, month }) {
  const first = toIso(new Date(Date.UTC(year, month - 1, 1)));
  const last = toIso(new Date(Date.UTC(year, month, 0)));
  const firstDow = parseIso(first).getUTCDay();
  const lastDow = parseIso(last).getUTCDay();
  return {
    start: addDays(first, firstDow === 0 ? 1 : firstDow === 6 ? 2 : 1 - firstDow),
    end: addDays(last, lastDow === 6 ? -1 : lastDow === 0 ? -2 : 5 - lastDow),
  };
}

export function surprisePercent(actual, estimate) {
  if (actual == null || estimate == null || estimate === 0) return null;
  return ((actual - estimate) / Math.abs(estimate)) * 100;
}

// Beat = every reported measure met its estimate, Miss = none did, Mixed = some did.
// Reported = results are out but there was no estimate to compare against.
export function getStatus(row) {
  if (row.epsActual == null) return "Upcoming";
  const results = [
    [row.epsActual, row.epsEstimate],
    [row.revenueActual, row.revenueEstimate],
  ]
    .filter(([actual, estimate]) => actual != null && estimate != null)
    .map(([actual, estimate]) => actual >= estimate);
  if (!results.length) return "Reported";
  if (results.every(Boolean)) return "Beat";
  if (!results.some(Boolean)) return "Miss";
  return "Mixed";
}

const NAME_SUFFIX = /[\s,]+(&\s*CO\.?|INC\.?|INCORPORATED|CORP\.?|CORPORATION|CO\.?|COMPANY|LTD\.?|LIMITED|PLC|N\.?V\.?|S\.?A\.?|AG|SE|LLC|L\.?P\.?|HOLDINGS?|GROUP|\/[A-Z]{2,3}\/?)$/i;
const LOWERCASE_WORDS = new Set(["OF", "THE", "AND", "FOR"]);

// "NETFLIX INC" → "Netflix", "JPMORGAN CHASE & CO" → "Jpmorgan Chase", "Apple Inc." → "Apple"
export function tidyCompanyName(title) {
  let name = title.trim();
  while (NAME_SUFFIX.test(name)) name = name.replace(NAME_SUFFIX, "");
  if (name === name.toUpperCase()) {
    name = name
      .split(" ")
      .map((word) => {
        if (LOWERCASE_WORDS.has(word)) return word.toLowerCase();
        if (word.length <= 2 || /[\d&.]/.test(word)) return word;
        return word[0] + word.slice(1).toLowerCase();
      })
      .join(" ");
  }
  return name || title;
}

function companySize(row) {
  return row.revenueEstimate ?? row.revenueActual ?? 0;
}

function lookupCompany(symbol, directory) {
  // SEC writes share classes with a dash (BRK-A), Finnhub with a dot (BRK.A)
  return directory[symbol.replace(".", "-")];
}

function companyName(symbol, company) {
  return company ? tidyCompanyName(company.title) : symbol;
}

function toEarnings(row, directory) {
  const company = lookupCompany(row.symbol, directory);
  const timing = TIMING[row.hour];
  return {
    ticker: row.symbol,
    name: companyName(row.symbol, company),
    cik: company?.cik ?? null,
    date: row.date,
    dateLabel: shortLabel(row.date),
    fiscalQuarter: row.quarter ?? null,
    fiscalYear: row.year ?? null,
    timing: timing?.tag ?? null,
    timingLabel: timing?.label ?? null,
    reported: row.epsActual != null,
    status: getStatus(row),
    epsEstimate: row.epsEstimate ?? null,
    epsActual: row.epsActual ?? null,
    epsSurprise: surprisePercent(row.epsActual, row.epsEstimate),
    revenueEstimate: row.revenueEstimate ?? null,
    revenueActual: row.revenueActual ?? null,
    revenueSurprise: surprisePercent(row.revenueActual, row.revenueEstimate),
  };
}

// Exchange filter options with the company count in [from, to] for each.
// `params` keeps the view and date in each link.
function buildFilters({ rows, listings, from, to, exchange, params }) {
  // Same companies the grid shows: this period, weekdays only
  const shown = rows.filter((row) => row.date >= from && row.date <= to && ![0, 6].includes(parseIso(row.date).getUTCDay()));
  const symbols = new Map(shown.map((row) => [row.symbol, listings[row.symbol]]));
  const countFor = (option) => [...symbols].filter(([symbol, mic]) => inOption(option, symbol, mic)).length;

  return EXCHANGES.map((option) => ({
    key: option.key,
    label: option.label,
    count: countFor(option),
    active: option === exchange,
    href: calendarHref({ ...params, exchange: exchangeParam(option) }),
  }));
}

// Tiles per day cell; when a day has more, the last slot becomes "+N"
const TILES_PER_DAY = 16;

function visibleCount(total) {
  return total > TILES_PER_DAY ? TILES_PER_DAY - 1 : total;
}

// `listings` ({ SYMBOL: MIC }) drops OTC stocks and funds; null skips that filter.
// Returns rows on any listed exchange, and rows on the chosen exchange.
function filterRows({ rows, listings, exchange }) {
  const valid = rows.filter((row) => row.symbol && row.date);
  if (!listings) return { listed: valid, shown: valid };
  const listed = valid.filter((row) => listings[row.symbol]);
  const shown = listed.filter((row) => inOption(exchange, row.symbol, listings[row.symbol]));
  return { listed, shown };
}

// date → that day's companies, largest (by revenue estimate) first
function groupByDate(rows) {
  // One row per company per day: Finnhub sometimes repeats a symbol
  const byDate = new Map();
  for (const row of rows) {
    const companies = byDate.get(row.date) ?? new Map();
    byDate.set(row.date, companies);
    const existing = companies.get(row.symbol);
    // Prefer the row with results, then the one with the bigger revenue figure
    const better =
      !existing ||
      (existing.epsActual == null && row.epsActual != null) ||
      ((existing.epsActual != null) === (row.epsActual != null) && companySize(row) > companySize(existing));
    if (better) companies.set(row.symbol, row);
  }
  return new Map([...byDate].map(([date, companies]) => [date, [...companies.values()].sort((a, b) => companySize(b) - companySize(a))]));
}

// Search box rule: ticker prefix or anywhere in the company name. `query` is upper-cased.
export function matchesQuery(earnings, query) {
  return !query || earnings.ticker.startsWith(query) || earnings.name.toUpperCase().includes(query);
}

const SEARCH_LIMIT = 100;

// 0 = exact ticker, 1 = ticker starts with the query, 2 = name contains it; null = no match
function searchRank(ticker, name, query) {
  if (ticker === query) return 0;
  if (ticker.startsWith(query)) return 1;
  return name.toUpperCase().includes(query) ? 2 : null;
}

// Every listed company reporting in `months` that matches, whatever the exchange filter:
// exact ticker first, then ticker prefix, then name matches, each by report date
export function buildSearchResults({ rows, directory, listings, months, query }) {
  const { listed } = filterRows({ rows, listings, exchange: ALL_EXCHANGES });
  const keys = new Set(months.map(monthKey));
  // Month ranges overlap at their edges; groupByDate drops the repeats
  const inMonths = listed.filter((row) => keys.has(row.date.slice(0, 7)) && ![0, 6].includes(parseIso(row.date).getUTCDay()));
  const q = query.trim().toUpperCase();
  const matches = [];
  for (const [date, companies] of groupByDate(inMonths)) {
    for (const row of companies) {
      const rank = searchRank(row.symbol, companyName(row.symbol, lookupCompany(row.symbol, directory)), q);
      if (rank != null) matches.push({ rank, date, row });
    }
  }
  return matches
    .sort((a, b) => a.rank - b.rank || a.date.localeCompare(b.date))
    .slice(0, SEARCH_LIMIT)
    .map(({ row }) => toEarnings(row, directory));
}

// The companies behind a day's "+N" tile
export function buildHiddenEarnings({ rows, directory, listings, exchange, date }) {
  const { shown } = filterRows({ rows, listings, exchange });
  const companies = groupByDate(shown.filter((row) => row.date === date)).get(date) ?? [];
  return companies.slice(visibleCount(companies.length)).map((row) => toEarnings(row, directory));
}

// What one view covers, and how to move from it. `focus` is the weekday a week or day view
// is built around; a month view has none.
function viewPeriod({ mode, target, focus, today, href }) {
  const thisWeekday = weekdayOf(today);

  if (mode === "week") {
    const monday = mondayOf(focus);
    const friday = addDays(monday, 4);
    const ends = monday.slice(5, 7) === friday.slice(5, 7) ? String(Number(friday.slice(8))) : shortLabel(friday);
    return {
      start: monday,
      end: friday,
      params: { view: "week", date: focus },
      title: `Week of ${shortLabel(monday)}`,
      label: `${shortLabel(monday)} – ${ends}`,
      unit: "week",
      periodNote: "this week",
      isCurrent: monday === mondayOf(thisWeekday),
      currentName: "this week",
      todayHref: href({ view: "week" }),
      prevHref: href({ view: "week", date: addDays(focus, -7) }),
      nextHref: href({ view: "week", date: addDays(focus, 7) }),
    };
  }

  if (mode === "day") {
    const weekday = WEEKDAYS[parseIso(focus).getUTCDay()];
    return {
      start: focus,
      end: focus,
      params: { view: "day", date: focus },
      title: `${weekday}, ${shortLabel(focus)}`,
      label: `${weekday.slice(0, 3)} ${shortLabel(focus)}`,
      unit: "day",
      periodNote: `on ${shortLabel(focus)}`,
      isCurrent: focus === thisWeekday,
      currentName: "today",
      todayHref: href({ view: "day" }),
      prevHref: href({ view: "day", date: shiftWeekday(focus, -1) }),
      nextHref: href({ view: "day", date: shiftWeekday(focus, 1) }),
    };
  }

  const month = MONTHS[target.month - 1];
  return {
    ...monthGridRange(target),
    params: { month: monthKey(target) },
    title: month,
    label: `${month} ${target.year}`,
    unit: "month",
    periodNote: "this month",
    isCurrent: monthKey(target) === today.slice(0, 7),
    currentName: MONTHS[parseIso(today).getUTCMonth()],
    todayHref: href({}),
    prevHref: href({ month: monthKey(shiftMonth(target, -1)) }),
    nextHref: href({ month: monthKey(shiftMonth(target, 1)) }),
  };
}

// `mode` is "month", "week" or "day". `target` is the month whose data `rows` holds; week and
// day views pass `focus`, a weekday inside that month's grid, and show every company that day
// (no "+N" cap: their cells are big enough to scroll).
export function buildCalendarView({ rows: allRows, directory, listings, exchange, mode = "month", target, focus = null, today }) {
  const href = (params) => calendarHref({ ...params, exchange: exchangeParam(exchange) });
  const period = viewPeriod({ mode, target, focus, today, href });
  const monthFirst = toIso(new Date(Date.UTC(target.year, target.month - 1, 1)));
  const monthLast = toIso(new Date(Date.UTC(target.year, target.month, 0)));
  // Days that count: the month itself in month view (not the grid's edge days), every day otherwise
  const [from, to] = mode === "month" ? [monthFirst, monthLast] : [period.start, period.end];

  const { listed, shown } = filterRows({ rows: allRows, listings, exchange });
  const filters = listings ? buildFilters({ rows: listed, listings, from, to, exchange, params: period.params }) : [];
  const byDate = groupByDate(shown);

  const days = [];
  // Unique companies: a few report on two dates in one month
  const periodCompanies = new Set();
  for (let iso = period.start; iso <= period.end; iso = addDays(iso, 1)) {
    const dow = parseIso(iso).getUTCDay();
    if (dow === 0 || dow === 6) continue;

    const companies = byDate.get(iso) ?? [];
    const inPeriod = iso >= from && iso <= to;
    if (inPeriod) companies.forEach((row) => periodCompanies.add(row.symbol));
    const shownCount = mode === "month" ? visibleCount(companies.length) : companies.length;
    const visible = companies.slice(0, shownCount);

    days.push({
      key: iso,
      label: `${shortLabel(iso).slice(0, 3).toUpperCase()} ${iso.slice(8)}`,
      longLabel: shortLabel(iso),
      // 0 = Monday … 4 = Friday
      weekday: dow - 1,
      isToday: iso === today,
      isPast: iso < today,
      inPeriod,
      count: companies.length,
      hidden: companies.length - visible.length,
      earnings: visible.map((row) => toEarnings(row, directory)),
      // Just enough to filter the "+N" companies without loading them
      hiddenIndex: companies.slice(shownCount).map((row) => ({
        ticker: row.symbol,
        name: companyName(row.symbol, lookupCompany(row.symbol, directory)),
      })),
    });
  }

  // The weekday the other views open on: the one shown, else today in the current month, else the month's first
  const anchor = focus ?? (period.isCurrent ? weekdayOf(today) : weekdayOf(monthFirst));
  const todayDate = parseIso(today);
  return {
    key: monthKey(target),
    mode,
    title: period.title,
    label: period.label,
    unit: period.unit,
    periodNote: period.periodNote,
    days,
    total: periodCompanies.size,
    today,
    todayLabel: `${WEEKDAYS[todayDate.getUTCDay()]} ${MONTHS[todayDate.getUTCMonth()]} ${todayDate.getUTCDate()}`,
    isCurrent: period.isCurrent,
    currentName: period.currentName,
    filters,
    // No note when unfiltered: "All" or exchange data unavailable
    exchangeNote: listings ? exchange.note : null,
    exchangeParam: exchangeParam(exchange),
    todayHref: period.todayHref,
    prevHref: period.prevHref,
    nextHref: period.nextHref,
    viewHrefs: {
      day: href({ view: "day", date: anchor }),
      week: href({ view: "week", date: anchor }),
      month: href({ month: monthKey(mode === "month" ? target : monthOf(anchor)) }),
    },
  };
}

export function formatEps(value) {
  if (value == null) return "—";
  return `${value < 0 ? "−$" : "$"}${Math.abs(value).toFixed(2)}`;
}

export function formatRevenue(value) {
  if (value == null) return "—";
  return value >= 1e9 ? `$${(value / 1e9).toFixed(2)}B` : `$${(value / 1e6).toFixed(1)}M`;
}

export function formatPercent(value) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
}
