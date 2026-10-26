"use client";

import { useEffect, useRef, useState } from "react";
import { matchesQuery } from "@/lib/earnings";
import { useWatchlist } from "@/lib/watchlist";
import { CalendarTitle, CalendarToolbar } from "./calendar-toolbar";
import { EarningsDetailsSheet } from "./earnings-details-sheet";
import { ExchangeFilter } from "./exchange-filter";
import { MonthGrid } from "./month-grid";
import { MarketSentiment } from "./market-sentiment";
import { MoreCompaniesDialog } from "./more-companies-dialog";
import { SiteHeader } from "./site-header";
import { StatusLegend } from "./status-legend";

// Unique companies on this month's calendar (visible tiles and "+N") that pass the filter
function countMatches(days, isMatch) {
  const tickers = new Set();
  for (const day of days) {
    if (!day.inMonth) continue;
    for (const e of [...day.earnings, ...day.hiddenIndex]) if (isMatch(e)) tickers.add(e.ticker);
  }
  return tickers.size;
}

// Wait for a pause in typing before searching
const SEARCH_DELAY_MS = 150;

export function EarningsCalendar({ view, sentiment, events }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const watchlist = useWatchlist();
  // Kept after close so the sheet's content stays put during its exit animation
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Profile + EPS history per ticker, fetched the first time a company is opened
  const [details, setDetails] = useState({});
  // "+N" modal: the day it shows, and each day's hidden companies once fetched
  const [moreDay, setMoreDay] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreLists, setMoreLists] = useState({});
  const moreKey = (dayKey) => `${view.key}|${view.exchangeParam ?? ""}|${dayKey}`;
  // In-flight or finished loads of a day's hidden companies
  const dayRequests = useRef({});

  const q = query.trim().toUpperCase();
  const filtering = Boolean(q) || scope === "watchlist";
  const isMatch = (e) => matchesQuery(e, q) && (scope === "all" || watchlist.has(e.ticker));

  // Search results come from the server and cover every exchange, not just the selected one
  const [search, setSearch] = useState({ key: "", state: "ready", results: [] });
  const searchKey = q ? `${view.key}|${q}` : "";
  useEffect(() => {
    if (!searchKey) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?${new URLSearchParams({ month: view.key, q })}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => setSearch({ key: searchKey, state: "ready", results: data.results }))
        .catch((error) => {
          if (error.name !== "AbortError") setSearch({ key: searchKey, state: "error", results: [] });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchKey, view.key, q]);
  // Until the new answer arrives, keep showing the last one
  const searchState = search.key === searchKey ? search.state : "loading";
  const searchResults = scope === "watchlist" ? search.results.filter((e) => watchlist.has(e.ticker)) : search.results;

  const matchCount = filtering ? countMatches(view.days, isMatch) : 0;

  let gridNote = "Pick a company to see results";
  if (scope === "watchlist" && !watchlist.tickers.length) {
    gridNote = "Watchlist is empty · star a company to add it";
  } else if (filtering) {
    gridNote = `${matchCount} ${matchCount === 1 ? "match" : "matches"} this month`;
  }

  const selectEarnings = (earnings) => {
    setSelected(earnings);
    setDetailsOpen(true);

    const { ticker } = earnings;
    if (details[ticker]) return;
    setDetails((d) => ({ ...d, [ticker]: { state: "loading" } }));
    fetch(`/api/earnings/${encodeURIComponent(ticker)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setDetails((d) => ({ ...d, [ticker]: { state: "ready", ...data } })))
      .catch(() => setDetails((d) => ({ ...d, [ticker]: { state: "error" } })));
  };

  // Resolves to the day's hidden companies, or null if the load failed
  const loadDay = (dayKey) => {
    const key = moreKey(dayKey);
    // Fetch once per day; a failed load retries next time
    if (dayRequests.current[key]) return dayRequests.current[key];
    setMoreLists((m) => ({ ...m, [key]: { state: "loading" } }));
    const params = new URLSearchParams({ month: view.key });
    if (view.exchangeParam) params.set("exchange", view.exchangeParam);
    const request = fetch(`/api/calendar/${dayKey}?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        setMoreLists((m) => ({ ...m, [key]: { state: "ready", earnings: data.earnings } }));
        return data.earnings;
      })
      .catch(() => {
        delete dayRequests.current[key];
        setMoreLists((m) => ({ ...m, [key]: { state: "error" } }));
        return null;
      });
    dayRequests.current[key] = request;
    return request;
  };

  // `day` carries `overflow`: tiles that didn't fit its cell on this screen
  const showMore = (day) => {
    setMoreDay(day);
    setMoreOpen(true);
    if (day.hiddenIndex.length) loadDay(day.key);
  };
  // The "+N" list: tiles that didn't fit, then the companies the server held back (fetched on open)
  const serverMore = moreDay?.hiddenIndex.length ? moreLists[moreKey(moreDay.key)] : { state: "ready", earnings: [] };
  const moreList =
    moreDay && serverMore?.state === "ready"
      ? { state: "ready", earnings: [...moreDay.overflow, ...serverMore.earnings] }
      : serverMore;

  const selectFromMore = (earnings) => {
    setMoreOpen(false);
    selectEarnings(earnings);
  };

  const jumpToToday = () => {
    document.getElementById(`day-${view.today}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  };

  // Open on today's cell; no-op when the month shown doesn't include today
  useEffect(() => {
    document.getElementById(`day-${view.today}`)?.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
  }, [view.today]);

  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        results={searchResults}
        searchState={searchState}
        onSelectResult={selectEarnings}
      />

      <main className="mx-auto box-border flex w-full max-w-360 flex-1 flex-col border-x">

        <MarketSentiment sentiment={sentiment} events={events} today={view.today} />
        <CalendarTitle view={view} />
        <ExchangeFilter filters={view.filters}>
          <CalendarToolbar view={view} scope={scope} onScopeChange={setScope} onToday={jumpToToday} />
        </ExchangeFilter>

        <MonthGrid
          days={view.days}
          filtering={filtering}
          isMatch={isMatch}
          onSelect={selectEarnings}
          onShowMore={showMore}
        />
        <StatusLegend />

      </main>

      <MoreCompaniesDialog
        day={moreDay}
        list={moreDay ? moreList : null}
        open={moreOpen}
        onOpenChange={setMoreOpen}
        filtering={filtering}
        isMatch={isMatch}
        onSelect={selectFromMore}
      />

      <EarningsDetailsSheet
        earnings={selected}
        details={selected ? details[selected.ticker] : null}
        watched={selected ? watchlist.has(selected.ticker) : false}
        onToggleWatch={() => watchlist.toggle(selected.ticker)}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
