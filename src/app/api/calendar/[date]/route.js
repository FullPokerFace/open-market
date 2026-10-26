import { requestFilter } from "@/lib/calendar-filter";
import { buildHiddenEarnings, monthGridRange, parseMonthKey } from "@/lib/earnings";
import { getCompanyDirectory } from "@/lib/companies";
import { getEarningsCalendar } from "@/lib/finnhub";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Companies hidden behind a day's "+N" tile: /api/calendar/2026-10-28?month=2026-10&exchange=nasdaq
// (no exchange: the visitor's saved list from its cookie, as on the page)
export async function GET(request, ctx) {
  const { date } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const target = parseMonthKey(params.get("month"));
  if (!DATE.test(date) || !target) {
    return Response.json({ error: "Invalid date or month" }, { status: 400 });
  }

  // Same range as the page, so the calendar comes from the weeks the page already saved
  const { start, end } = monthGridRange(target);
  if (date < start || date > end) {
    return Response.json({ error: "Date is outside that month" }, { status: 400 });
  }

  try {
    const [rows, filter] = await Promise.all([getEarningsCalendar(start, end), requestFilter(params.get("exchange"))]);
    const directory = await getCompanyDirectory(rows.map((row) => row.symbol)).catch(() => null);
    const earnings = buildHiddenEarnings({ rows, directory, exchange: filter, date });
    return Response.json({ earnings });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load companies" }, { status: 502 });
  }
}
