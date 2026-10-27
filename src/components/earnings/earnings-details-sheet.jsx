"use client";

import { useState } from "react";
import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon, PlusIcon, XIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatEps, formatPercent, formatRevenue } from "@/lib/earnings";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "./company-logo";
import { EpsSurpriseChart } from "./eps-surprise-chart";

const BADGES = ["bg-badge-1", "bg-badge-2", "bg-badge-3", "bg-badge-4", "bg-badge-5"];
const STATUS_TEXT = {
  Beat: "text-beat",
  Miss: "text-miss",
  Mixed: "text-mixed",
  Reported: "text-muted-foreground",
  Upcoming: "text-muted-foreground",
};

const linkButton = "flex h-10 items-center gap-2 px-5 no-underline";

// Stable badge color per ticker
function badgeFor(ticker) {
  let h = 7;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) % 9973;
  return BADGES[h % BADGES.length];
}

function edgarLinks({ cik, ticker }) {
  if (!cik) {
    const search = `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker)}`;
    return { release: search, filings: search };
  }
  const company = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}`;
  return { release: `${company}&type=8-K`, filings: company };
}

// TradingView's prefix for each exchange MIC we list
const TRADINGVIEW_EXCHANGES = { XNAS: "NASDAQ", XNYS: "NYSE", XASE: "AMEX", ARCX: "AMEX", BATS: "CBOE" };

// Without a known exchange, TradingView resolves the bare ticker itself
function tradingViewLinks({ ticker, exchange }) {
  const prefix = TRADINGVIEW_EXCHANGES[exchange];
  const page = prefix ? `${prefix}-${ticker}` : ticker;
  const chart = prefix ? `${prefix}:${ticker}` : ticker;
  return {
    financials: `https://www.tradingview.com/symbols/${encodeURIComponent(page)}/`,
    chart: `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(chart)}`,
  };
}

function Metric({ label, value, comparison, surprise, reported, className }) {
  let note = "AWAITING REPORT";
  if (reported) note = surprise == null ? "NO ESTIMATE" : `${formatPercent(surprise)} SURPRISE`;

  return (
    <div className={cn("flex flex-col gap-1.5 px-6 py-5", className)}>
      <span className="eyebrow text-muted-foreground">{label}</span>
      <span className="display-type text-[32px] leading-[1.05]">{value}</span>
      <span className="text-[13px] text-body">{comparison}</span>
      <span
        className={cn(
          "font-mono text-xs font-bold",
          surprise == null ? "text-muted-foreground" : surprise >= 0 ? "text-beat" : "text-miss"
        )}
      >
        {note}
      </span>
    </div>
  );
}

function comparisonText(estimate, format, reported) {
  if (estimate == null) return "No consensus estimate";
  return reported ? `vs. ${format(estimate)} expected` : "Consensus estimate";
}

function SurpriseHistory({ details }) {
  if (!details || details.state === "loading") {
    return <p className="eyebrow m-0 text-muted-foreground">Loading history…</p>;
  }
  if (details.state === "error" || !details.history?.length) {
    return <p className="eyebrow m-0 text-muted-foreground">History unavailable</p>;
  }
  return <EpsSurpriseChart history={details.history} />;
}

const NEW_LIST = "new-list";
const listControl = "flex h-10 items-center gap-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase";

// Pick one of the visitor's watchlists, then add the company to it or take it out; "+ New watchlist" starts one with it in.
// The pick stays while other companies are opened, so adding several to one list is a click each.
function ListPicker({ ticker, lists, activeListId, onToggle, onNewList }) {
  const [picked, setPicked] = useState(null);
  const list = lists.find((l) => l.id === picked) ?? lists.find((l) => l.id === activeListId) ?? lists[0];

  if (!list) {
    return (
      <button type="button" onClick={onNewList} className={cn(listControl, "mt-1 cursor-pointer justify-center bg-foreground px-5 text-background")}>
        <PlusIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        Add to a new watchlist
      </button>
    );
  }

  const inList = list.tickers.includes(ticker);
  // A watchlist can't be emptied from here: an empty one would show no calendar at all
  const last = inList && list.tickers.length === 1;
  let title = inList ? `Remove ${ticker} from ${list.name}` : `Add ${ticker} to ${list.name}`;
  if (last) title = `${ticker} is the only company in ${list.name}`;

  const toggle = () => {
    // Keep this list picked: toggling the list on screen briefly unmatches it while the calendar reloads
    setPicked(list.id);
    onToggle(list.id);
  };

  return (
    <div className="mt-1 flex">
      <label className="relative flex min-w-0 flex-1">
        <span className="sr-only">Watchlist</span>
        {/* Native select so phones get their own picker; "+ New watchlist" opens the dialog and the pick stays put */}
        <select
          value={list.id}
          onChange={(ev) => (ev.target.value === NEW_LIST ? onNewList() : setPicked(ev.target.value))}
          className={cn(listControl, "w-full min-w-0 cursor-pointer appearance-none truncate border border-line-strong bg-background pr-10 pl-4 text-foreground")}
        >
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
              {l.tickers.includes(ticker) ? " ✓" : ""}
            </option>
          ))}
          <option value={NEW_LIST}>+ New watchlist</option>
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-foreground"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </label>
      <button
        type="button"
        onClick={toggle}
        disabled={last}
        aria-pressed={inList}
        title={title}
        className={cn(
          listControl,
          "-ml-px shrink-0 cursor-pointer px-5 disabled:cursor-default disabled:opacity-50",
          inList ? "border border-blue text-blue" : "bg-foreground text-background"
        )}
      >
        {inList ? (
          <CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <PlusIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        )}
        {inList ? "Added" : "Add"}
      </button>
    </div>
  );
}

function Details({ earnings: e, details, listProps }) {
  const history = details?.history ?? [];
  const beats = history.filter((q) => q.value >= 0).length;
  const links = edgarLinks(e);
  const tradingView = tradingViewLinks(e);
  const quarter = e.fiscalQuarter ? `Fiscal Q${e.fiscalQuarter} ${e.fiscalYear}` : "Latest";
  const when = e.timingLabel ? `, ${e.timingLabel}` : "";

  return (
    <>
      <div className="eyebrow flex items-center justify-between border-b pl-6 text-muted-foreground">
        <span>
          <span className="text-foreground">{quarter} results</span>
        </span>
        <SheetClose
          aria-label="Close details"
          className="grid h-11 w-12 cursor-pointer place-items-center border-l text-foreground"
        >
          <XIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        </SheetClose>
      </div>

      <div className="flex flex-col gap-3.5 border-b p-6">
        <div className="eyebrow flex items-center justify-between gap-3">
          <span className={cn("px-2 py-0.5 text-white", badgeFor(e.ticker))}>{e.ticker}</span>
          <span className="truncate text-muted-foreground">{details?.profile?.industry}</span>
        </div>
        <div className="mt-1 flex items-center gap-4">
          {/* Keyed by ticker: the sheet stays mounted between companies, and a missing logo mustn't carry over */}
          <CompanyLogo key={e.ticker} ticker={e.ticker} className="size-12 shrink-0" />
          <SheetTitle className="display-type min-w-0 text-[34px] font-bold">{details?.profile?.name || e.name}</SheetTitle>
        </div>
        <SheetDescription className="text-[15px] text-body">
          {e.reported ? "Reported" : "Reports"} {e.dateLabel}
          {when}.
        </SheetDescription>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("chip", STATUS_TEXT[e.status])}>{e.status}</span>
          <span className="chip text-muted-foreground">Adjusted EPS</span>
          {e.timing && <span className="chip text-muted-foreground">{e.timing}</span>}
        </div>
        <ListPicker ticker={e.ticker} {...listProps} />
      </div>

      <div className="grid grid-cols-2 border-b">
        <Metric
          className="border-r"
          label="EPS"
          value={formatEps(e.reported ? e.epsActual : e.epsEstimate)}
          comparison={comparisonText(e.epsEstimate, formatEps, e.reported)}
          surprise={e.epsSurprise}
          reported={e.reported}
        />
        <Metric
          label="Revenue"
          value={formatRevenue(e.reported ? e.revenueActual : e.revenueEstimate)}
          comparison={comparisonText(e.revenueEstimate, formatRevenue, e.reported)}
          surprise={e.revenueSurprise}
          reported={e.reported}
        />
      </div>

      <div className="flex flex-col gap-3.5 border-b px-6 pt-5 pb-6">
        <div className="eyebrow flex items-baseline justify-between gap-3">
          <h3 className="m-0 text-muted-foreground">
            EPS surprise{history.length > 0 && ` · ${history.length} quarters`}
          </h3>
          {history.length > 0 && (
            <span className="text-foreground">
              Beat {beats} / {history.length}
            </span>
          )}
        </div>
        <SurpriseHistory details={details} />
      </div>

      <div className="flex flex-wrap gap-2 px-6 pt-5 pb-7 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
        <a href={tradingView.financials} target="_blank" rel="noopener noreferrer" className={cn(linkButton, "bg-foreground text-background")}>
          Financials
          <ArrowUpRightIcon className="size-3" strokeWidth={2.4} aria-hidden="true" />
        </a>
        <a href={tradingView.chart} target="_blank" rel="noopener noreferrer" className={cn(linkButton, "bg-foreground text-background")}>
          Chart
          <ArrowUpRightIcon className="size-3" strokeWidth={2.4} aria-hidden="true" />
        </a>
        <a href={links.release} target="_blank" rel="noopener noreferrer" className={cn(linkButton, "border border-line-strong text-foreground")}>
          Earnings release
          <ArrowUpRightIcon className="size-3" strokeWidth={2.4} aria-hidden="true" />
        </a>
        <a href={links.filings} target="_blank" rel="noopener noreferrer" className={cn(linkButton, "border border-line-strong text-foreground")}>
          SEC filings
          <ArrowUpRightIcon className="size-3" strokeWidth={2.4} aria-hidden="true" />
        </a>
        <p className="mt-2 mb-0 basis-full font-sans text-xs font-normal tracking-normal text-muted-foreground normal-case">
          Adjusted EPS compared with consensus estimates. Data from Finnhub; filings from SEC EDGAR; financials and charts on TradingView.
        </p>
      </div>
    </>
  );
}

// `lists`: the visitor's ticker lists; `activeListId` is the one on screen, picked first.
// `onToggleInList(id)` adds the company to that list or takes it out; `onNewList()` starts a list with it in.
export function EarningsDetailsSheet({ earnings, details, lists, activeListId, onToggleInList, onNewList, open, onOpenChange }) {
  const listProps = { lists, activeListId, onToggle: onToggleInList, onNewList };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="gap-0 overflow-y-auto bg-background p-0 shadow-none data-[side=right]:w-full data-[side=right]:sm:max-w-115"
      >
        {earnings && <Details earnings={earnings} details={details} listProps={listProps} />}
      </SheetContent>
    </Sheet>
  );
}
