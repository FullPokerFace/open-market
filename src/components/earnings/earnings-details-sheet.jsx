"use client";

import { ArrowUpRightIcon, StarIcon, XIcon } from "lucide-react";
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

function Details({ earnings: e, details, watched, onToggleWatch }) {
  const history = details?.history ?? [];
  const beats = history.filter((q) => q.value >= 0).length;
  const links = edgarLinks(e);
  const quarter = e.fiscalQuarter ? `Fiscal Q${e.fiscalQuarter} ${e.fiscalYear}` : "Latest";
  const when = e.timingLabel ? `, ${e.timingLabel}` : "";

  return (
    <>
      <div className="eyebrow flex items-center justify-between border-b pl-6 text-muted-foreground">
        <span>
          03 / <span className="text-foreground">{quarter} results</span>
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
        <button
          type="button"
          onClick={onToggleWatch}
          aria-pressed={watched}
          title={watched ? `Remove ${e.ticker} from watchlist` : `Add ${e.ticker} to watchlist`}
          className={cn(
            "mt-1 flex h-10 cursor-pointer items-center justify-center gap-2 px-5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase",
            watched ? "border border-blue text-blue" : "bg-foreground text-background"
          )}
        >
          <StarIcon className="size-3.5" strokeWidth={2.2} fill={watched ? "currentColor" : "none"} aria-hidden="true" />
          {watched ? "On your watchlist" : "Add to watchlist"}
        </button>
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
        <a href={links.release} target="_blank" rel="noopener noreferrer" className={cn(linkButton, "bg-foreground text-background")}>
          Earnings release
          <ArrowUpRightIcon className="size-3" strokeWidth={2.4} aria-hidden="true" />
        </a>
        <a href={links.filings} target="_blank" rel="noopener noreferrer" className={cn(linkButton, "border border-line-strong text-foreground")}>
          SEC filings
          <ArrowUpRightIcon className="size-3" strokeWidth={2.4} aria-hidden="true" />
        </a>
        <p className="mt-2 mb-0 basis-full font-sans text-xs font-normal tracking-normal text-muted-foreground normal-case">
          Adjusted EPS compared with consensus estimates. Data from Finnhub; filings from SEC EDGAR.
        </p>
      </div>
    </>
  );
}

export function EarningsDetailsSheet({ earnings, details, watched, onToggleWatch, open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="gap-0 overflow-y-auto bg-background p-0 shadow-none data-[side=right]:w-full data-[side=right]:sm:max-w-115"
      >
        {earnings && <Details earnings={earnings} details={details} watched={watched} onToggleWatch={onToggleWatch} />}
      </SheetContent>
    </Sheet>
  );
}
