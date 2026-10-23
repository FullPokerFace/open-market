// Server-only Finnhub client. Responses are cached so the free plan's
// 60 calls/minute is never close to being reached.
import { cacheLife } from "next/cache";
import { addDays, daysBetween } from "@/lib/earnings";

const BASE_URL = "https://finnhub.io/api/v1";

// Finnhub returns at most this many calendar rows per request
const CALENDAR_ROW_LIMIT = 1500;

async function finnhub(path, params) {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB_API_KEY is not set in .env.local");

  const res = await fetch(`${BASE_URL}${path}?${new URLSearchParams(params)}`, {
    headers: { "X-Finnhub-Token": token },
  });
  if (!res.ok) throw new Error(`Finnhub ${path} responded ${res.status}`);
  return res.json();
}

async function fetchCalendarRange(from, to) {
  const { earningsCalendar = [] } = await finnhub("/calendar/earnings", { from, to });
  if (earningsCalendar.length < CALENDAR_ROW_LIMIT || from === to) return earningsCalendar;

  // Hit the row cap, so some rows are missing: split the range and fetch each half
  const mid = addDays(from, Math.floor(daysBetween(from, to) / 2));
  const halves = await Promise.all([fetchCalendarRange(from, mid), fetchCalendarRange(addDays(mid, 1), to)]);
  return halves.flat();
}

// Every earnings row from `from` to `to` (ISO dates), fetched a week at a time
export async function getEarningsCalendar(from, to) {
  "use cache";
  cacheLife("hours");

  const weeks = [];
  for (let start = from; start <= to; start = addDays(start, 7)) {
    const end = addDays(start, 6);
    weeks.push([start, end < to ? end : to]);
  }
  const results = await Promise.all(weeks.map(([start, end]) => fetchCalendarRange(start, end)));
  return results.flat();
}

// Adjusted EPS surprise for recent quarters, oldest first (4 on the free plan)
export async function getEpsHistory(symbol) {
  "use cache";
  cacheLife("hours");

  const rows = await finnhub("/stock/earnings", { symbol });
  return rows
    .filter((row) => row.surprisePercent != null)
    .map((row) => ({
      quarter: `Q${row.quarter}'${String(row.year).slice(2)}`,
      value: row.surprisePercent,
    }))
    .reverse();
}

// Exchange MICs we show: NYSE, Nasdaq, NYSE American, NYSE Arca, Cboe. OTC is left out.
const LISTED_EXCHANGES = new Set(["XNYS", "XNAS", "XASE", "ARCX", "BATS"]);

// { SYMBOL: exchange MIC } for exchange-listed stocks, without closed-end funds
export async function getListedSymbols() {
  "use cache";
  cacheLife("days");

  const symbols = await finnhub("/stock/symbol", { exchange: "US" });
  const listed = {};
  for (const { symbol, mic, type } of symbols) {
    if (LISTED_EXCHANGES.has(mic) && type !== "Closed-End Fund") listed[symbol] = mic;
  }
  return listed;
}

export async function getCompanyProfile(symbol) {
  "use cache";
  cacheLife("days");

  const profile = await finnhub("/stock/profile2", { symbol });
  return {
    name: profile.name ?? null,
    industry: profile.finnhubIndustry ?? null,
    website: profile.weburl ?? null,
  };
}
