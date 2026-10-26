import { Suspense } from "react";
import { after, connection } from "next/server";
import { EarningsCalendar } from "@/components/earnings/earnings-calendar";
import { SiteFooter } from "@/components/earnings/site-footer";
import { buildMonthView, monthGridRange, parseExchange, parseMonthKey, shiftMonth, todayInNewYork } from "@/lib/earnings";
import { getEarningsCalendar, getListedSymbols } from "@/lib/finnhub";
import { getCompanyDirectory } from "@/lib/sec";
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
  const { month, exchange } = await searchParams;
  await connection();

  const today = todayInNewYork();
  const current = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  const target = parseMonthKey(month) ?? current;
  const { start, end } = monthGridRange(target);
  // Once the page is sent, make sure this month and the next two are in the cache
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
    const [rows, directory, listings] = await Promise.all([
      getEarningsCalendar(start, end),
      // Names and exchange filtering are nice to have: degrade instead of failing the page
      getCompanyDirectory().catch((error) => {
        console.error(error);
        return {};
      }),
      getListedSymbols().catch((error) => {
        console.error(error);
        return null;
      }),
    ]);
    view = buildMonthView({ rows, directory, listings, exchange: parseExchange(exchange), target, today });
  } catch (error) {
    console.error(error);
  }

  if (!view) return <CalendarMessage>Earnings data is unavailable right now. Try again in a minute.</CalendarMessage>;
  return <EarningsCalendar view={view} sentiment={await sentiment} events={await events} />;
}

// Months kept warm from this month on, so paging ahead never waits on Finnhub
const WARM_MONTHS = 3;

// Loads each month into the server cache; months already cached cost nothing.
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
