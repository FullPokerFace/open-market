import { Suspense } from "react";
import { connection } from "next/server";
import { EarningsCalendar } from "@/components/earnings/earnings-calendar";
import { SiteFooter } from "@/components/earnings/site-footer";
import { buildMonthView, monthGridRange, parseExchange, parseMonthKey, todayInNewYork } from "@/lib/earnings";
import { getEarningsCalendar, getListedSymbols } from "@/lib/finnhub";
import { getCompanyDirectory } from "@/lib/sec";

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
  const target = parseMonthKey(month) ?? { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  const { start, end } = monthGridRange(target);

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
  return <EarningsCalendar view={view} />;
}

function CalendarMessage({ children }) {
  return (
    <div className="flex-1">
      <main className="eyebrow mx-auto box-border max-w-360 border-x px-6 py-10 text-muted-foreground">{children}</main>
    </div>
  );
}
