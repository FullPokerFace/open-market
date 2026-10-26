import { Suspense } from "react";
import { after, connection } from "next/server";
import { EarningsCalendar } from "@/components/earnings/earnings-calendar";
import { SiteFooter } from "@/components/earnings/site-footer";
import {
  buildCalendarView,
  monthGridRange,
  monthOf,
  parseDateKey,
  parseMonthKey,
  parseViewMode,
  shiftMonth,
  todayInNewYork,
  weekdayOf,
} from "@/lib/earnings";
import { requestFilter } from "@/lib/calendar-filter";
import { getCompanyDirectory } from "@/lib/companies";
import { getEarningsCalendar } from "@/lib/finnhub";
import { getMacroEvents } from "@/lib/kalshi";
import { getFearGreed } from "@/lib/sentiment";

export default function Home({ searchParams }) {
  return (
    <>
      <Suspense fallback={<CalendarMessage>Loading earnings…</CalendarMessage>}>
        <Calendar searchParams={searchParams} />
      </Suspense>
      <SiteFooter />
    </>
  );
}

async function Calendar({ searchParams }) {
  const { month, exchange, view: viewParam, date } = await searchParams;
  await connection();
  const filter = await requestFilter(exchange);

  const today = todayInNewYork();
  const current = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  const mode = parseViewMode(viewParam);
  // Week and day views are built around one weekday and load the month it falls in
  const focus = mode === "month" ? null : weekdayOf(parseDateKey(date) ?? today);
  const target = focus ? monthOf(focus) : (parseMonthKey(month) ?? current);
  const { start, end } = monthGridRange(target);
  // Once the page is sent, make sure this month and the next two are saved in the database
  after(() => warmCalendar(current));

  // Sentiment and key releases are extras: the calendar shows without them
  const sentiment = getFearGreed().catch((error) => {
    console.error(error);
    return null;
  });
  const events = getMacroEvents().catch((error) => {
    console.error(error);
    return null;
  });

  let view = null;
  try {
    const rows = await getEarningsCalendar(start, end);
    // Names and exchange filtering are nice to have: degrade instead of failing the page
    const directory = await getCompanyDirectory(rows.map((row) => row.symbol)).catch((error) => {
      console.error(error);
      return null;
    });
    view = buildCalendarView({ rows, directory, exchange: filter, mode, target, focus, today });
  } catch (error) {
    console.error(error);
  }

  if (!view) return <CalendarMessage>Earnings data is unavailable right now. Try again in a minute.</CalendarMessage>;
  return <EarningsCalendar view={view} sentiment={await sentiment} events={await events} />;
}

// Months kept warm from this month on, so paging ahead never waits on Finnhub
const WARM_MONTHS = 3;

// Saves each month in the database; months saved within the hour cost one lookup.
// A failure only means that month is fetched when someone opens it.
function warmCalendar(fromMonth) {
  return Promise.all(
    Array.from({ length: WARM_MONTHS }, (_, i) => {
      const { start, end } = monthGridRange(shiftMonth(fromMonth, i));
      return getEarningsCalendar(start, end).catch((error) => console.error(error));
    })
  );
}

function CalendarMessage({ children }) {
  return (
    <div className="flex-1">
      <main className="eyebrow mx-auto box-border max-w-360 border-x px-6 py-10 text-muted-foreground">{children}</main>
    </div>
  );
}
