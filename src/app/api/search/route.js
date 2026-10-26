import { buildSearchResults, monthGridRange, monthKey, parseMonthKey, shiftMonth, todayInNewYork } from "@/lib/earnings";
import { getEarningsCalendar, getListedSymbols } from "@/lib/finnhub";
import { getCompanyDirectory } from "@/lib/sec";

// Months searched from this one on: the same months the page keeps warm in the cache
const SEARCH_MONTHS = 3;

// Company search across every exchange: /api/search?month=2026-10&q=net
// Covers this month and the next two, plus `month` (the one on screen) when it's outside them
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const target = parseMonthKey(params.get("month"));
  const query = (params.get("q") ?? "").trim();
  if (!target || !query || query.length > 40) {
    return Response.json({ error: "Invalid month or query" }, { status: 400 });
  }

  try {
    const today = todayInNewYork();
    const current = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
    const months = Array.from({ length: SEARCH_MONTHS }, (_, i) => shiftMonth(current, i));
    if (!months.some((m) => monthKey(m) === monthKey(target))) months.push(target);

    // Same ranges as the page, so each month comes from its cache entry
    const [calendars, directory, listings] = await Promise.all([
      Promise.all(months.map((m) => monthGridRange(m)).map(({ start, end }) => getEarningsCalendar(start, end))),
      getCompanyDirectory().catch(() => ({})),
      getListedSymbols().catch(() => null),
    ]);
    const rows = calendars.flat();
    return Response.json({ results: buildSearchResults({ rows, directory, listings, months, query }) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not search companies" }, { status: 502 });
  }
}
