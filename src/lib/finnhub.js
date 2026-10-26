// Server-only Finnhub client. Responses are saved in MongoDB so the free plan's
// 60 calls/minute is never close to being reached.
import { COLLECTIONS, DAY, HOUR, stored } from "@/lib/db";
import { addDays, daysBetween } from "@/lib/earnings";

const BASE_URL = "https://finnhub.io/api/v1";

// Finnhub returns at most this many calendar rows per request
const CALENDAR_ROW_LIMIT = 1500;

async function finnhub(path, params) {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB_API_KEY is not set in .env.local");

  const query = new URLSearchParams(params);
  const started = performance.now();
  const res = await fetch(`${BASE_URL}${path}?${query}`, {
    headers: { "X-Finnhub-Token": token },
  });
  // One line per real request (saved copies never get here); the token is in a header, so it stays out of the log
  console.log(`[finnhub] GET ${path}?${query} → ${res.status} in ${Math.round(performance.now() - started)}ms`);
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

// Monday of the week `iso` falls in
function mondayOf(iso) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return addDays(iso, -((dow + 6) % 7));
}

// Every earnings row from `from` to `to` (ISO dates). Saved a Monday–Sunday week at a time,
// so months that share a week share its saved copy.
export async function getEarningsCalendar(from, to) {
  const mondays = [];
  for (let monday = mondayOf(from); monday <= to; monday = addDays(monday, 7)) mondays.push(monday);

  const weeks = await Promise.all(
    mondays.map((monday) => stored(COLLECTIONS.earningsCalendar, monday, HOUR, () => fetchCalendarRange(monday, addDays(monday, 6))))
  );
  return weeks.flat().filter((row) => row.date >= from && row.date <= to);
}

// Adjusted EPS surprise for recent quarters, oldest first (4 on the free plan)
export function getEpsHistory(symbol) {
  return stored(COLLECTIONS.epsHistory, symbol, HOUR, async () => {
    const rows = await finnhub("/stock/earnings", { symbol });
    return rows
      .filter((row) => row.surprisePercent != null)
      .map((row) => ({
        quarter: `Q${row.quarter}'${String(row.year).slice(2)}`,
        value: row.surprisePercent,
      }))
      .reverse();
  });
}

// Exchange MICs we show: NYSE, Nasdaq, NYSE American, NYSE Arca, Cboe. OTC is left out.
const LISTED_EXCHANGES = new Set(["XNYS", "XNAS", "XASE", "ARCX", "BATS"]);

// { SYMBOL: exchange MIC } for exchange-listed stocks, without closed-end funds. Saved by getCompanyDirectory.
export async function fetchListedSymbols() {
  const symbols = await finnhub("/stock/symbol", { exchange: "US" });
  const listed = {};
  for (const { symbol, mic, type } of symbols) {
    if (LISTED_EXCHANGES.has(mic) && type !== "Closed-End Fund") listed[symbol] = mic;
  }
  return listed;
}

export function getCompanyProfile(symbol) {
  return stored(COLLECTIONS.companyProfiles, symbol, DAY, async () => {
    const profile = await finnhub("/stock/profile2", { symbol });
    return {
      name: profile.name ?? null,
      industry: profile.finnhubIndustry ?? null,
      website: profile.weburl ?? null,
    };
  });
}
