"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

function DayCell({ day, capacity, isLastColumn, filtering, isMatch, onSelect, onShowMore }) {
  const background = day.isToday ? "bg-bg-today" : day.isPast ? "bg-bg-past" : "bg-background";
  const dotBorder = day.isToday ? "border-bg-today" : day.isPast ? "border-bg-past" : "border-background";

  // Tiles that fit this cell; past that, the last slot becomes "+N". The server already
  // holds back companies beyond 16 (`hiddenIndex`); `overflow` is what this screen can't fit.
  const shownCount = day.count > capacity ? capacity - 1 : day.count;
  const tiles = day.earnings.slice(0, shownCount);
  const overflow = day.earnings.slice(shownCount);
  const hidden = day.count - tiles.length;
  const hiddenMatches = filtering ? [...overflow, ...day.hiddenIndex].filter(isMatch).length : null;

  return (
    <div
      id={`day-${day.key}`}
      className={cn(
        // contain:size keeps tiles from stretching the row: rows split the height, tiles adapt
        "flex min-h-0 flex-col gap-2 overflow-hidden border-b px-4 pt-2.5 pb-2 [contain:size]",
        background,
        !isLastColumn && "border-r",
        // inset ring so the thicker frame doesn't shift the grid
        day.isToday && "shadow-[inset_0_0_0_2px_var(--color-foreground)]"
      )}
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

      {/* Fills the rest of the cell; MonthGrid measures it to decide how many tiles fit */}
      <div data-tiles className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,48px)] content-start gap-2">
        {tiles.map((e) => (
          <TickerTile key={e.ticker} earnings={e} dimmed={!isMatch(e)} dotBorder={dotBorder} onSelect={onSelect} />
        ))}
        {hidden > 0 && (
          <MoreTile day={{ ...day, hidden, overflow }} matches={hiddenMatches} onShowMore={onShowMore} />
        )}
      </div>
    </div>
  );
}

const TILE_PX = 48;
const TILE_GAP_PX = 8;
// Most tiles a cell shows: the server sends at most this many per day
const MAX_TILES = 16;
// Shortest week row (date + one row of tiles); shorter windows scroll instead of squashing
const MIN_ROW_PX = 92;
const HEADER_ROW_PX = 32;

function tilesAcross(px) {
  return Math.max(1, Math.floor((px + TILE_GAP_PX) / (TILE_PX + TILE_GAP_PX)));
}

// How many tiles fit one day cell, re-measured as the window resizes.
// Every cell is the same size; cells showing "No earnings" have less room but no tiles.
function useTileCapacity(gridRef) {
  const [capacity, setCapacity] = useState(MAX_TILES);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    const measure = () => {
      const boxes = [...grid.querySelectorAll("[data-tiles]")];
      if (!boxes.length) return;
      const height = Math.max(...boxes.map((box) => box.clientHeight));
      setCapacity(Math.min(MAX_TILES, tilesAcross(boxes[0].clientWidth) * tilesAcross(height)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridRef]);

  return capacity;
}

export function MonthGrid({ days, filtering, isMatch, onSelect, onShowMore }) {
  const gridRef = useRef(null);
  const capacity = useTileCapacity(gridRef);
  const weeks = days.length / 5;

  return (
    // Takes the height left between the toolbar and the legend; each week gets an equal share
    <div className="mx-6 flex-1 overflow-x-auto border-x border-t" style={{ minHeight: HEADER_ROW_PX + weeks * MIN_ROW_PX }}>
      <div
        ref={gridRef}
        className="grid h-full min-w-275 grid-cols-5"
        style={{ gridTemplateRows: `${HEADER_ROW_PX}px repeat(${weeks}, minmax(${MIN_ROW_PX}px, 1fr))` }}
      >
        {WEEKDAYS.map((weekday, i) => (
          <div
            key={weekday}
            className={cn(
              "flex items-center justify-between border-b px-4 font-mono text-[11px] font-medium tracking-[0.15em]",
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
            capacity={capacity}
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
