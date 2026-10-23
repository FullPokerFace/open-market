import { cn } from "@/lib/utils";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const WEEKDAY_BADGES = ["bg-badge-1", "bg-badge-2", "bg-badge-3", "bg-badge-4", "bg-badge-5"];

// "Reported" = results out but no estimate to grade them against
const STATUS_DOT = { Beat: "bg-beat", Mixed: "bg-mixed", Miss: "bg-miss", Reported: "bg-muted-foreground" };

function tickerSize(ticker) {
  if (ticker.length >= 5) return "text-[10px]";
  if (ticker.length === 4) return "text-[11px]";
  return "text-xs";
}

function TickerTile({ earnings, dimmed, dotBorder, onSelect }) {
  const { ticker, name, reported, status, timingLabel } = earnings;
  const label = `${ticker} · ${name} · ${reported ? status : timingLabel ? `Reports ${timingLabel}` : "Upcoming"}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(earnings)}
      aria-label={label}
      title={label}
      className={cn(
        "relative grid size-12 cursor-pointer place-items-center rounded-[10px] border bg-tile p-0 font-mono font-bold tracking-[0.02em] text-strong shadow-tile transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        tickerSize(ticker),
        dimmed && "opacity-[0.18]"
      )}
    >
      {ticker}
      {reported && (
        <span
          aria-hidden="true"
          className={cn("absolute -top-1 -right-1 size-2.5 border-2", STATUS_DOT[status], dotBorder)}
        />
      )}
    </button>
  );
}

// `matches`: how many hidden companies pass the search / watchlist, or null when nothing is filtered
function MoreTile({ day, matches, onShowMore }) {
  const matchNote = matches ? `, ${matches} ${matches === 1 ? "matches" : "match"}` : "";

  return (
    <button
      type="button"
      onClick={() => onShowMore(day)}
      aria-label={`Show ${day.hidden} more companies on ${day.longLabel}${matchNote}`}
      title={`Show ${day.hidden} more companies${matchNote}`}
      className={cn(
        "relative grid size-12 cursor-pointer place-items-center rounded-[10px] border border-dashed border-line-strong p-0 font-mono text-[11px] font-bold text-muted-foreground transition-opacity hover:border-solid hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        matches === 0 && "opacity-[0.18]",
        matches > 0 && "border-solid border-blue text-foreground"
      )}
    >
      +{day.hidden}
      {matches > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-2 -right-2 grid h-4 min-w-4 place-items-center bg-blue px-1 text-[9px] leading-none text-white"
        >
          {matches}
        </span>
      )}
    </button>
  );
}

function DayCell({ day, isLastColumn, filtering, isMatch, onSelect, onShowMore }) {
  const background = day.isToday ? "bg-bg-today" : day.isPast ? "bg-bg-past" : "bg-background";
  const dotBorder = day.isToday ? "border-bg-today" : day.isPast ? "border-bg-past" : "border-background";

  return (
    <div
      id={`day-${day.key}`}
      className={cn("flex min-h-60 flex-col gap-4 border-b px-5 pt-4 pb-6", background, !isLastColumn && "border-r")}
    >
      <div className="flex min-h-5 items-center justify-between font-mono text-[11px] font-medium tracking-[0.15em]">
        {day.isToday ? (
          <span className="bg-foreground px-2 py-0.5 text-background">{day.label} · TODAY</span>
        ) : (
          <span className={day.inMonth ? "text-foreground" : "text-muted-foreground"}>{day.label}</span>
        )}
        {!day.isToday && day.count > 0 && (
          <span className="text-muted-foreground">{String(day.count).padStart(2, "0")}</span>
        )}
      </div>

      {day.count === 0 && <span className="chip self-start text-muted-foreground">No earnings</span>}

      {/* 4 tiles per row in a full-width cell; wraps to 3 on narrower screens */}
      <div className="grid grid-cols-[repeat(auto-fill,48px)] gap-2">
        {day.earnings.map((e) => (
          <TickerTile key={e.ticker} earnings={e} dimmed={!isMatch(e)} dotBorder={dotBorder} onSelect={onSelect} />
        ))}
        {day.hidden > 0 && (
          <MoreTile day={day} matches={filtering ? day.hiddenIndex.filter(isMatch).length : null} onShowMore={onShowMore} />
        )}
      </div>
    </div>
  );
}

export function MonthGrid({ days, filtering, isMatch, onSelect, onShowMore }) {
  return (
    <div className="overflow-x-auto border-t">
      <div className="grid min-w-275 grid-cols-5">
        {WEEKDAYS.map((weekday, i) => (
          <div
            key={weekday}
            className={cn(
              "flex items-center justify-between border-b px-5 py-3 font-mono text-[11px] font-medium tracking-[0.15em]",
              i < 4 && "border-r"
            )}
          >
            <span className={cn("px-2 py-0.5 text-white", WEEKDAY_BADGES[i])}>0{i + 1}</span>
            <span className="text-muted-foreground">{weekday}</span>
          </div>
        ))}
        {days.map((day, i) => (
          <DayCell
            key={day.key}
            day={day}
            isLastColumn={i % 5 === 4}
            filtering={filtering}
            isMatch={isMatch}
            onSelect={onSelect}
            onShowMore={onShowMore}
          />
        ))}
      </div>
    </div>
  );
}
