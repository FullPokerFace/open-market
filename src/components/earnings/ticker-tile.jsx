import { cn } from "@/lib/utils";
import { TIMING_ICONS } from "./timing-icons";

// "Reported" = results out but no estimate to grade them against
const STATUS_DOT = { Beat: "bg-beat", Mixed: "bg-mixed", Miss: "bg-miss", Reported: "bg-muted-foreground" };

function tickerSize(ticker) {
  if (ticker.length >= 5) return "text-[10px]";
  if (ticker.length === 4) return "text-[11px]";
  return "text-xs";
}

// Day background and the matching border for status dots, so a dot reads as cut out of the tile
export function dayColors(day) {
  if (day.isToday) return { background: "bg-bg-today", dotBorder: "border-bg-today" };
  if (day.isPast) return { background: "bg-bg-past", dotBorder: "border-bg-past" };
  return { background: "bg-background", dotBorder: "border-background" };
}

// `showTiming` adds a corner icon for when the company reports (sunrise / sun / moon); the week and day views group by timing instead
export function TickerTile({ earnings, dimmed, dotBorder, showTiming = false, onSelect }) {
  const { ticker, name, reported, status, timing, timingLabel } = earnings;
  const label = `${ticker} · ${name} · ${reported ? status : timingLabel ? `Reports ${timingLabel}` : "Upcoming"}`;
  const TimingIcon = showTiming ? TIMING_ICONS[timing] : null;

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
      {TimingIcon && <TimingIcon className="absolute top-1 left-1 size-2.5" />}
      {reported && (
        <span
          aria-hidden="true"
          className={cn("absolute -top-1 -right-1 size-2.5 border-2", STATUS_DOT[status], dotBorder)}
        />
      )}
    </button>
  );
}
