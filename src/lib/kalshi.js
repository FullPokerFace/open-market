// Server-only: upcoming market-moving releases (FOMC, CPI, jobs, GDP) and what traders expect,
// from Kalshi's public market data. Free, no key; each Kalshi event is one release date.
import { COLLECTIONS, LATEST, MINUTE, stored } from "@/lib/db";

const BASE_URL = "https://api.elections.kalshi.com/trade-api/v2";

// Fed decision outcomes by market ticker suffix, in display order
const FED_OUTCOMES = [
  { suffix: "C26", label: "Cut 50bp+" },
  { suffix: "C25", label: "Cut 25bp" },
  { suffix: "H0", label: "Hold" },
  { suffix: "H25", label: "Hike 25bp" },
  { suffix: "H26", label: "Hike 50bp+" },
];

// Series that share a `group` and a release date become one card
const SERIES = [
  { ticker: "KXFEDDECISION", group: "fed", title: "FOMC decision", kind: "decision" },
  { ticker: "KXCPI", group: "cpi", title: "CPI inflation", label: "m/m", format: (v) => `${v.toFixed(1)}%` },
  { ticker: "KXCPIYOY", group: "cpi", title: "CPI inflation", label: "y/y", format: (v) => `${v.toFixed(1)}%` },
  { ticker: "KXPAYROLLS", group: "jobs", title: "Jobs report", label: "Payrolls", format: (v) => `${Math.round(v / 1000)}K` },
  { ticker: "KXU3", group: "jobs", title: "Jobs report", label: "Unemployment", format: (v) => `${v.toFixed(1)}%` },
  { ticker: "KXGDP", group: "gdp", title: "GDP growth", label: "Annualized", format: (v) => `${v.toFixed(1)}%` },
];

// Wall Street date and time of a release: { date: "2026-10-28", dateLabel: "Oct 28 · Wed", timeLabel: "2:00 PM ET" }
const ET_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const ET_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });

function etLabels(iso) {
  const at = new Date(iso);
  const p = Object.fromEntries(ET_PARTS.formatToParts(at).map(({ type, value }) => [type, value]));
  return {
    date: ET_DATE.format(at),
    dateLabel: `${p.month} ${p.day} · ${p.weekday}`,
    timeLabel: `${p.hour}:${p.minute} ${p.dayPeriod} ET`,
  };
}

// Chance a market resolves Yes: the bid/ask midpoint, or the last trade when one side is empty
function chance(market) {
  const bid = Number(market.yes_bid_dollars);
  const ask = Number(market.yes_ask_dollars);
  return bid > 0 && ask > 0 ? (bid + ask) / 2 : Number(market.last_price_dollars);
}

// Release time: the Fed's statement time, or a minute after trading stops for data releases
function releaseTime(event) {
  if (event.strike_date) return event.strike_date;
  const close = Math.min(...event.markets.map((m) => Date.parse(m.close_time)));
  return new Date(close + 60_000).toISOString();
}

// The level traders put even odds on, read off "Above X" markets
function impliedMedian(markets) {
  const ladder = markets
    .filter((m) => m.strike_type === "greater" && typeof m.floor_strike === "number")
    .map((m) => ({ strike: m.floor_strike, p: chance(m) }))
    .sort((a, b) => a.strike - b.strike);
  if (!ladder.length) return null;
  // Thin markets can be out of order; "above a higher level" can't be likelier
  for (let i = 1; i < ladder.length; i++) ladder[i].p = Math.min(ladder[i].p, ladder[i - 1].p);

  const i = ladder.findIndex((rung) => rung.p < 0.5);
  if (i === 0) return ladder[0].strike;
  if (i === -1) return ladder.at(-1).strike;
  const lo = ladder[i - 1];
  const hi = ladder[i];
  return lo.strike + ((lo.p - 0.5) / (lo.p - hi.p)) * (hi.strike - lo.strike);
}

function fedOutcomes(event) {
  const outcomes = FED_OUTCOMES.map(({ suffix, label }) => {
    const market = event.markets.find((m) => m.ticker.endsWith(`-${suffix}`));
    return { label, chance: market ? chance(market) : 0 };
  });
  const total = outcomes.reduce((sum, o) => sum + o.chance, 0) || 1;
  return outcomes.map((o) => ({ ...o, chance: Math.round((o.chance / total) * 100) }));
}

async function nextEvent(series) {
  const params = new URLSearchParams({ series_ticker: series.ticker, status: "open", with_nested_markets: "true", limit: "3" });
  const res = await fetch(`${BASE_URL}/events?${params}`);
  if (!res.ok) throw new Error(`Kalshi ${series.ticker} responded ${res.status}`);
  const { events = [] } = await res.json();

  const upcoming = events
    .filter((e) => e.markets?.length)
    .map((e) => ({ event: e, at: releaseTime(e) }))
    .sort((a, b) => a.at.localeCompare(b.at));
  if (!upcoming.length) return null;
  const { event, at } = upcoming[0];

  // The Fed card's date says it all; data cards name the period measured ("In Oct 2026" → "Oct 2026")
  if (series.kind === "decision") return { series, at, period: null, outcomes: fedOutcomes(event) };
  const period = event.strike_period || event.sub_title?.replace(/^In /, "");
  const median = impliedMedian(event.markets);
  return median === null ? null : { series, at, period, expectation: { label: series.label, value: series.format(median) } };
}

// [{ key, title, date, dateLabel, timeLabel, period, outcomes, expectations }], soonest first
export function getMacroEvents() {
  return stored(COLLECTIONS.keyReleases, LATEST, 5 * MINUTE, fetchMacroEvents);
}

async function fetchMacroEvents() {
  const settled = await Promise.allSettled(SERIES.map(nextEvent));
  const found = [];
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) found.push(result.value);
    else if (result.status === "rejected") console.error(result.reason);
  }
  if (!found.length) throw new Error("Kalshi returned no upcoming releases");

  // One card per group: its soonest release, with every series out that day
  const groups = new Map();
  for (const item of found.sort((a, b) => a.at.localeCompare(b.at))) {
    const { group, title } = item.series;
    const card = groups.get(group);
    if (!card) {
      groups.set(group, {
        key: group,
        title,
        at: item.at,
        ...etLabels(item.at),
        period: item.period,
        outcomes: item.outcomes ?? null,
        expectations: item.expectation ? [item.expectation] : [],
      });
    } else if (card.date === etLabels(item.at).date && item.expectation) {
      card.expectations.push(item.expectation);
    }
  }
  return [...groups.values()];
}
