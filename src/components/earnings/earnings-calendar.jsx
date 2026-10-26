"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { calendarHref, matchesQuery } from "@/lib/earnings";
import { rememberList, useTickerLists } from "@/lib/ticker-lists";
import { useWatchlist } from "@/lib/watchlist";
import { CalendarTitle, CalendarToolbar } from "./calendar-toolbar";
import { CreateListDialog } from "./create-list-dialog";
import { DayView } from "./day-view";
import { EarningsDetailsSheet } from "./earnings-details-sheet";
import { ExchangeFilter } from "./exchange-filter";
import { MonthGrid } from "./month-grid";
import { MarketSentiment } from "./market-sentiment";
import { MoreCompaniesDialog } from "./more-companies-dialog";
import { SiteHeader } from "./site-header";
import { StatusLegend } from "./status-legend";
import { useCompanySearch } from "./use-company-search";

// Unique companies in the month / week / day shown (visible tiles and "+N") that pass the filter
function countMatches(days, isMatch) {
  const tickers = new Set();
  for (const day of days) {
    if (!day.inPeriod) continue;
    for (const e of [...day.earnings, ...day.hiddenIndex]) if (isMatch(e)) tickers.add(e.ticker);
  }
  return tickers.size;
}

export function EarningsCalendar({ view, sentiment, events }) {
  const [query, setQuery] = useState("");
  // The header's search results are open: only then does the query dim the companies that don't match
  const [searchOpen, setSearchOpen] = useState(false);
  const [scope, setScope] = useState("all");
  const watchlist = useWatchlist();
  const tickerLists = useTickerLists();
  const [newListOpen, setNewListOpen] = useState(false);
  // Kept after close so the sheet's content stays put during its exit animation
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Profile + EPS history per ticker, fetched the first time a company is opened
  const [details, setDetails] = useState({});
  // "+N" modal: the day it shows, and each day's hidden companies once fetched
  const [moreDay, setMoreDay] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreLists, setMoreLists] = useState({});
  // The exchange or list on screen, for the "+N" requests
  const filterEntries = Object.entries(view.filterParams).filter(([, value]) => value);
  // A list isn't in the params (it rides in a cookie), so its tickers keep its days apart from the default market's
  const moreKey = (dayKey) => `${view.key}|${new URLSearchParams(filterEntries)}|${view.listTickers ?? ""}|${dayKey}`;
  // In-flight or finished loads of a day's hidden companies
  const dayRequests = useRef({});

  const q = query.trim().toUpperCase();
  // Closing search (a click outside, Escape, picking a result) shows every company again; the text is kept
  const highlight = searchOpen ? q : "";
  const filtering = Boolean(highlight) || scope === "watchlist";
  const isMatch = (e) => matchesQuery(e, highlight) && (scope === "all" || watchlist.has(e.ticker));

  // Search results come from the server and cover every exchange, not just the selected one
  const search = useCompanySearch(q, view.key);
  const searchState = search.state;
  const searchResults = scope === "watchlist" ? search.results.filter((e) => watchlist.has(e.ticker)) : search.results;

  // A list is a server-side filter: its tickers go in a cookie and the server sends only its companies.
  // The one on screen is whichever saved list has the same tickers.
  const shownTickers = view.listTickers && [...view.listTickers].sort().join(",");
  const activeList = shownTickers
    ? (tickerLists.lists.find((list) => [...list.tickers].sort().join(",") === shownTickers) ?? null)
    : null;
  const router = useRouter();
  const showList = (list) => {
    rememberList(list.tickers);
    // Same view without a market in the URL, so the server reads the list from the cookie
    const href = calendarHref(view.periodParams);
    if (href === `${window.location.pathname}${window.location.search}`) router.refresh();
    else router.push(href, { scroll: false });
  };
  const createList = (name, tickers) => showList(tickerLists.create(name, tickers));

  const matchCount = filtering ? countMatches(view.days, isMatch) : 0;

  let gridNote = "Pick a company to see results";
  if (scope === "watchlist" && !watchlist.tickers.length) {
    gridNote = "Watchlist is empty · star a company to add it";
  } else if (filtering) {
    gridNote = `${matchCount} ${matchCount === 1 ? "match" : "matches"} ${view.periodNote}`;
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
    const params = new URLSearchParams([["month", view.key], ...filterEntries]);
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
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        results={searchResults}
        searchState={searchState}
        onSelectResult={selectEarnings}
      />

      <main className="mx-auto box-border flex w-full max-w-360 flex-1 flex-col border-x">

        <MarketSentiment sentiment={sentiment} events={events} today={view.today} />
        <CalendarTitle view={view} />
        <ExchangeFilter
          filters={view.filters}
          lists={tickerLists.lists}
          activeListId={activeList?.id ?? null}
          showingList={Boolean(view.listTickers)}
          onSelectList={(id) => showList(tickerLists.lists.find((list) => list.id === id))}
          onSelectExchange={() => rememberList(null)}
          onNewList={() => setNewListOpen(true)}
        >
          <CalendarToolbar view={view} scope={scope} onScopeChange={setScope} onToday={jumpToToday} />
        </ExchangeFilter>

        {view.mode === "day" ? (
          <DayView day={view.days[0]} isMatch={isMatch} onSelect={selectEarnings} />
        ) : (
          <MonthGrid
            days={view.days}
            fit={view.mode === "month"}
            filtering={filtering}
            isMatch={isMatch}
            onSelect={selectEarnings}
            onShowMore={showMore}
          />
        )}
        <StatusLegend />

      </main>

      <CreateListDialog open={newListOpen} onOpenChange={setNewListOpen} month={view.key} onCreate={createList} />

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
