import { buildSearchResults, monthGridRange, parseMonthKey } from "@/lib/earnings";
import { getEarningsCalendar, getListedSymbols } from "@/lib/finnhub";
import { getCompanyDirectory } from "@/lib/sec";

// Month-wide company search across every exchange: /api/search?month=2026-10&q=net
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const target = parseMonthKey(params.get("month"));
  const query = (params.get("q") ?? "").trim();
  if (!target || !query || query.length > 40) {
    return Response.json({ error: "Invalid month or query" }, { status: 400 });
  }

  try {
    // Same range as the page, so the calendar comes from the page's cache entry
    const { start, end } = monthGridRange(target);
    const [rows, directory, listings] = await Promise.all([
      getEarningsCalendar(start, end),
      getCompanyDirectory().catch(() => ({})),
      getListedSymbols().catch(() => null),
    ]);
    return Response.json({ results: buildSearchResults({ rows, directory, listings, target, query }) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not search companies" }, { status: 502 });
  }
}
