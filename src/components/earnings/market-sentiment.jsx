import { daysBetween } from "@/lib/earnings";
import { cn } from "@/lib/utils";
import { Title } from "@/components/ui/title";

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
// Below md it drops under the calendar (the parent is a flex column) so the calendar comes first.
export function MarketSentiment({ sentiment, events, today }) {
  return (
    <section
      aria-label="Market sentiment and key releases"
      className="order-last flex flex-wrap border-t md:order-none md:border-t-0 md:border-b"
    >
      <FearGreed sentiment={sentiment} />
      <KeyReleases events={events} today={today} />
    </section>
  );
}

function FearGreed({ sentiment }) {
  return (
    <div className="box-border flex w-full flex-col gap-3 border-b px-6 py-8 sm:w-80 sm:border-r sm:border-b-0">
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

function Meter({ score }) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      aria-label="Fear and Greed Index, 0 extreme fear to 100 extreme greed"
      className="relative pt-1.5"
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
      <div className="eyebrow mt-1 flex justify-between text-[9px] text-muted-foreground">
        <span>Fear</span>
        <span>Greed</span>
      </div>
    </div>
  );
}

function KeyReleases({ events, today }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 px-6 py-8">
      <div className="flex items-baseline justify-between gap-3">
        <Title level={2} size="md" highlight="releases" className="m-0">
          Key releases
        </Title>
        <span className="eyebrow text-muted-foreground">Expectations · Kalshi</span>
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
