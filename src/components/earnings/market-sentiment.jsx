"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { daysBetween, MARKET_PANEL_COOKIE } from "@/lib/earnings";
import { cn } from "@/lib/utils";
import { Title } from "@/components/ui/title";

const YEAR_SECONDS = 365 * 24 * 60 * 60;

// CNN's bands, left to right; `width` is the band's share of 0–100
const ZONES = [
  { rating: "extreme fear", width: 25, swatch: "bg-miss" },
  { rating: "fear", width: 20, swatch: "bg-miss/45" },
  { rating: "neutral", width: 10, swatch: "bg-mixed/60" },
  { rating: "greed", width: 20, swatch: "bg-beat/45" },
  { rating: "extreme greed", width: 25, swatch: "bg-beat" },
];

// Fed outcomes: cuts in green, hold neutral, hikes in red
const OUTCOME_SWATCH = {
  "Cut 50bp+": "bg-beat",
  "Cut 25bp": "bg-beat/55",
  Hold: "bg-foreground/35",
  "Hike 25bp": "bg-miss/55",
  "Hike 50bp+": "bg-miss",
};

function ratingColor(rating) {
  if (rating.includes("fear")) return "text-miss";
  if (rating.includes("greed")) return "text-beat";
  return "text-mixed";
}

function untilLabel(today, date) {
  const days = daysBetween(today, date);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// Market sentiment (CNN Fear & Greed meter) beside the next market-moving releases.
// Collapsed (the default) it's one row: the score and a small meter, then each release's name and how soon it is.
// The choice is saved in a cookie the server reads (`defaultExpanded`), so the page opens the way it was left.
// Below md it drops under the calendar (the parent is a flex column) so the calendar comes first.
export function MarketSentiment({ sentiment, events, today, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    document.cookie = `${MARKET_PANEL_COOKIE}=${next ? "expanded" : "collapsed"}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
  };
  const panelToggle = <PanelToggle expanded={expanded} onClick={toggle} />;

  return (
    <section
      aria-label="Market sentiment and key releases"
      className="order-last flex flex-wrap border-t md:order-none md:border-t-0 md:border-b"
    >
      {expanded ? (
        <>
          <FearGreed sentiment={sentiment} />
          <KeyReleases events={events} today={today} toggle={panelToggle} />
        </>
      ) : (
        <CompactBar sentiment={sentiment} events={events} today={today} toggle={panelToggle} />
      )}
    </section>
  );
}

function PanelToggle({ expanded, onClick }) {
  const Icon = expanded ? ChevronUpIcon : ChevronDownIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse market sentiment and key releases" : "Expand market sentiment and key releases"}
      className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 border border-line-strong px-3 font-mono text-[10px] font-bold tracking-[0.12em] text-foreground uppercase hover:bg-tag"
    >
      {expanded ? "Collapse" : "Expand"}
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

// The collapsed panel. From md: one row (sentiment, releases, toggle at the end).
// Below md, top to bottom: sentiment with the toggle beside it (meter on its own line), then one release per line.
function CompactBar({ sentiment, events, today, toggle }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-6 py-2.5 max-md:py-4">
      <div className="flex items-center gap-3 max-md:min-w-0 max-md:flex-1 max-md:flex-wrap max-md:gap-y-2">
        <span className="eyebrow text-muted-foreground">Fear &amp; Greed</span>
        {sentiment ? (
          <>
            <span className="display-type text-[20px] leading-none">{sentiment.score}</span>
            <span className={cn("font-mono text-[11px] font-bold tracking-[0.12em] uppercase", ratingColor(sentiment.rating))}>
              {sentiment.rating}
            </span>
            <Meter score={sentiment.score} compact />
          </>
        ) : (
          <span className="eyebrow text-muted-foreground">Unavailable</span>
        )}
      </div>

      {events?.length > 0 && (
        <ol
          aria-label="Key releases"
          className="m-0 flex min-w-0 flex-1 list-none flex-wrap gap-x-5 gap-y-1 p-0 max-md:order-last max-md:basis-full max-md:flex-col max-md:gap-y-2"
        >
          {events.map((event) => (
            <CompactRelease key={event.key} event={event} today={today} />
          ))}
        </ol>
      )}

      <div className="ml-auto self-start md:self-auto">{toggle}</div>
    </div>
  );
}

function CompactRelease({ event, today }) {
  const soon = daysBetween(today, event.date) <= 1;
  const live = event.date === today;

  return (
    // Below md the name sits left and "In 3 days" right, a line each
    <li className="flex items-center gap-1.5 max-md:justify-between max-md:border-t max-md:pt-2">
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-strong">
        {live && <LiveDot />}
        {event.title}
      </span>
      <span className={cn("eyebrow text-[10px]", soon ? "font-bold text-blue" : "text-muted-foreground")}>
        {untilLabel(today, event.date)}
      </span>
    </li>
  );
}

function FearGreed({ sentiment }) {
  return (
    <div className="box-border flex w-full flex-col gap-3 border-b px-6 py-8 md:w-80 md:border-r md:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <Title level={2} size="md" highlight="sentiment" className="m-0">
          Market sentiment
        </Title>
        <span className="eyebrow text-muted-foreground">CNN</span>
      </div>

      {sentiment ? (
        <>
          <div className="flex items-baseline gap-3">
            <span className="display-type text-[32px] leading-none">{sentiment.score}</span>
            <span className={cn("font-mono text-[12px] font-bold tracking-[0.12em] uppercase", ratingColor(sentiment.rating))}>
              {sentiment.rating}
            </span>
            <Change value={sentiment.score - sentiment.previousClose} />
          </div>
          <Meter score={sentiment.score} />
        </>
      ) : (
        <p className="eyebrow m-0 py-3 text-muted-foreground">Unavailable right now</p>
      )}
    </div>
  );
}

function Change({ value }) {
  if (!value) return null;
  return (
    <span className="eyebrow ml-auto text-muted-foreground">
      {value > 0 ? "▲" : "▼"} {Math.abs(value)} since close
    </span>
  );
}

// `compact`: a short bar without the Fear / Greed labels, for the collapsed panel
function Meter({ score, compact = false }) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      aria-label="Fear and Greed Index, 0 extreme fear to 100 extreme greed"
      className={cn("relative", compact ? "w-24 py-0.75 max-md:w-full max-md:basis-full" : "pt-1.5")}
    >
      <div className="flex h-2 gap-px">
        {ZONES.map(({ rating, width, swatch }) => (
          <span key={rating} title={rating} className={swatch} style={{ width: `${width}%` }} />
        ))}
      </div>
      <span
        aria-hidden="true"
        className="absolute top-0 h-3.5 w-0.75 -translate-x-1/2 bg-foreground"
        style={{ left: `${score}%` }}
      />
      {!compact && (
        <div className="eyebrow mt-1 flex justify-between text-[9px] text-muted-foreground">
          <span>Fear</span>
          <span>Greed</span>
        </div>
      )}
    </div>
  );
}

function KeyReleases({ events, today, toggle }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <Title level={2} size="md" highlight="releases" className="m-0">
          Key releases
        </Title>
        <div className="flex items-center gap-3">
          <span className="eyebrow text-muted-foreground">Expectations · Kalshi</span>
          {toggle}
        </div>
      </div>

      {events?.length ? (
        <ol className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {events.map((event) => (
            <ReleaseCard key={event.key} event={event} today={today} />
          ))}
        </ol>
      ) : (
        <p className="eyebrow m-0 py-3 text-muted-foreground">Release calendar unavailable right now</p>
      )}
    </div>
  );
}

function ReleaseCard({ event, today }) {
  const soon = daysBetween(today, event.date) <= 1;
  // Out today: blue frame with a continuous pulse (still frame only when reduced motion is on)
  const live = event.date === today;

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-1 border bg-tile px-3 py-2 shadow-tile",
        soon && "border-foreground",
        live && "border-blue motion-safe:animate-release-pulse"
      )}
    >
      <div className="eyebrow flex flex-col justify-between gap-2 text-[10px] text-muted-foreground">
        <span>
          {event.dateLabel}
          {event.timeLabel}
        </span>
        <span className={cn("inline-flex items-center gap-1.5", soon && "font-bold text-blue")}>
          {live && <LiveDot />}
          {untilLabel(today, event.date)}
        </span>
      </div>
      <div className="truncate text-[14px] font-semibold text-strong">
        {event.title}
        {event.period && <span className="font-normal text-muted-foreground"> · {event.period}</span>}
      </div>
      {event.outcomes ? <Outcomes outcomes={event.outcomes} /> : <Expectations items={event.expectations} />}
    </li>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-1.5" aria-hidden="true">
      <span className="absolute inline-flex size-full rounded-full bg-blue opacity-75 motion-safe:animate-ping" />
      <span className="relative inline-flex size-1.5 rounded-full bg-blue" />
    </span>
  );
}

// Stacked bar of the decision odds, then the outcomes worth naming
function Outcomes({ outcomes }) {
  const shown = outcomes.filter((o) => o.chance > 0);
  const named = [...shown].sort((a, b) => b.chance - a.chance).filter((o) => o.chance >= 5);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-1.5 gap-px" aria-hidden="true">
        {shown.map((o) => (
          <span key={o.label} className={OUTCOME_SWATCH[o.label]} style={{ width: `${o.chance}%` }} />
        ))}
      </div>
      <div className="truncate font-mono text-[11px] text-body">
        {named.map((o, i) => (
          <span key={o.label}>
            {i > 0 && " · "}
            <span className={cn(i === 0 && "font-bold text-foreground")}>{o.label}</span> {o.chance}%
          </span>
        ))}
      </div>
    </div>
  );
}

function Expectations({ items }) {
  return (
    <div className="truncate font-mono text-[11px] text-body">
      Exp.{" "}
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && " · "}
          {item.label} <span className="font-bold text-foreground">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
