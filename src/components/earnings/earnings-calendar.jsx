"use client";

import { useEffect, useRef, useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { calendarHref, matchesQuery } from "@/lib/earnings";
import { rememberList, useTickerLists } from "@/lib/ticker-lists";
import { CalendarBreadcrumb, CalendarTitle, CalendarToolbar } from "./calendar-toolbar";
import { CreateListDialog } from "./create-list-dialog";
import { DayView } from "./day-view";
import { EarningsDetailsSheet } from "./earnings-details-sheet";
import { ExchangeFilter } from "./exchange-filter";
import { dayTransitionName, MonthGrid } from "./month-grid";
import { MarketSentiment } from "./market-sentiment";
import { MoreCompaniesDialog } from "./more-companies-dialog";
import { SiteHeader } from "./site-header";
import { StatusLegend } from "./status-legend";
import { useCompanySearch } from "./use-company-search";

// Centres a day's cell on screen; jumps instead of gliding for visitors who prefer reduced motion.
// `block` "nearest" suits the day view, taller than the screen: it only scrolls when the day is out of view.
function scrollToDay(key, block = "center") {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  document.getElementById(`day-${key}`)?.scrollIntoView({ behavior, block, inline: "center" });
}

// Wait before gliding to the day: longer on the first load so the title and filters are seen first,
// short after switching views so the cell ↔ day morph finishes first
const FIRST_SCROLL_MS = 1000;
const SWITCH_SCROLL_MS = 300;

export function EarningsCalendar({ view, sentiment, events, marketExpanded }) {
  const [query, setQuery] = useState("");
  // The header's search results are open: only then does the query dim the companies that don't match
  const [searchOpen, setSearchOpen] = useState(false);
  const tickerLists = useTickerLists();
  const [newListOpen, setNewListOpen] = useState(false);
  // The company a new list starts with when it's made from the details sheet, else null
  const [newListSeed, setNewListSeed] = useState(null);
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
  const filtering = Boolean(highlight);
  const isMatch = (e) => matchesQuery(e, highlight);

  // Search results come from the server and cover every exchange, not just the selected one
  const search = useCompanySearch(q, view.key);

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
  const openNewList = (seed = null) => {
    setNewListSeed(seed);
    setNewListOpen(true);
  };
  const createList = (name, tickers) => {
    const list = tickerLists.create(name, tickers);
    // Made from the details sheet: the calendar stays where it is. Null when there are already MAX_LISTS.
    if (list && !newListSeed) showList(list);
  };
  // From the details sheet. The list on screen changed: reload it so the company shows up or goes.
  const toggleInList = (id) => {
    const list = tickerLists.toggle(id, selected.ticker);
    if (list && id === activeList?.id) showList(list);
  };

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

  const jumpToToday = () => scrollToDay(view.tradingDay);

  // The day to bring into view: the one shown in day view, else today's cell (the next trading day's on a weekend)
  const focusDay = view.mode === "day" ? view.days[0].key : view.tradingDay;
  // The page stays mounted when the view changes, so this tells the first load from a later switch
  const firstView = useRef(`${view.mode}|${focusDay}`);

  // Open at the top, then glide to the day; again on every switch between day, week and month.
  // Called off if the visitor scrolls, taps or types first; no-op when the view shown doesn't include that day.
  useEffect(() => {
    const first = firstView.current === `${view.mode}|${focusDay}`;
    const block = view.mode === "day" ? "nearest" : "center";
    const timer = setTimeout(() => scrollToDay(focusDay, block), first ? FIRST_SCROLL_MS : SWITCH_SCROLL_MS);
    const cancel = () => clearTimeout(timer);
    const events = ["wheel", "touchstart", "pointerdown", "keydown"];
    events.forEach((type) => window.addEventListener(type, cancel, { once: true, passive: true }));
    return () => {
      cancel();
      events.forEach((type) => window.removeEventListener(type, cancel));
    };
  }, [view.mode, focusDay]);

  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader
        query={query}
        onQueryChange={setQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        results={search.results}
        searchState={search.state}
        onSelectResult={selectEarnings}
      />

      <main className="mx-auto box-border flex w-full max-w-360 flex-1 flex-col border-x">

        <MarketSentiment sentiment={sentiment} events={events} today={view.today} defaultExpanded={marketExpanded} />
        <CalendarTitle view={view} />
        <ExchangeFilter
          filters={view.filters}
          lists={tickerLists.lists}
          activeListId={activeList?.id ?? null}
          showingList={Boolean(view.listTickers)}
          onSelectList={(id) => showList(tickerLists.lists.find((list) => list.id === id))}
          onSelectExchange={() => rememberList(null)}
          onNewList={() => openNewList()}
        >
          <CalendarToolbar view={view} onToday={jumpToToday} />
        </ExchangeFilter>

        <CalendarBreadcrumb view={view} />
        {view.mode === "day" ? (
          // Same name as the date's month / week cell: opening the day from there grows the cell into this box, and back
          <ViewTransition name={dayTransitionName(view.days[0].key)} share="day-morph" default="none">
            <DayView day={view.days[0]} isMatch={isMatch} onSelect={selectEarnings} />
          </ViewTransition>
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

      <CreateListDialog
        open={newListOpen}
        onOpenChange={setNewListOpen}
        month={view.key}
        seed={newListSeed}
        onSave={createList}
      />

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
        lists={tickerLists.lists}
        activeListId={activeList?.id ?? null}
        onToggleInList={toggleInList}
        onNewList={() => openNewList({ ticker: selected.ticker, name: selected.name })}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
