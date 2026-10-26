"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { dayColors, TickerTile } from "./ticker-tile";
import { SECTION_MIN_PX, TimingSections } from "./timing-sections";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"];
export const WEEKDAY_BADGES = ["bg-badge-1", "bg-badge-2", "bg-badge-3", "bg-badge-4", "bg-badge-5"];

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

// `capacity` null = week view: every company, split by report time, scrolling inside the cell
function DayCell({ day, capacity, isLastColumn, filtering, isMatch, onSelect, onShowMore }) {
  const { background, dotBorder } = dayColors(day);

  // Tiles that fit this cell; past that, the last slot becomes "+N". The server already
  // holds back companies beyond 16 (`hiddenIndex`); `overflow` is what this screen can't fit.
  const shownCount = capacity != null && day.count > capacity ? capacity - 1 : day.count;
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
        // Inset outline so the thicker frame doesn't shift the grid; outlines paint over the week view's tinted sections
        day.isToday && "outline-2 -outline-offset-2 outline-foreground"
      )}
    >
      <div className="flex min-h-5 items-center justify-between font-mono text-[11px] font-medium tracking-[0.15em]">
        {day.isToday ? (
          <span className="bg-foreground px-2 py-0.5 text-background">{day.label} · TODAY</span>
        ) : (
          <span className={day.inPeriod ? "text-foreground" : "text-muted-foreground"}>{day.label}</span>
        )}
        {!day.isToday && day.count > 0 && (
          <span className="text-muted-foreground">{String(day.count).padStart(2, "0")}</span>
        )}
      </div>

      {day.count === 0 && <span className="chip self-start text-muted-foreground">No earnings</span>}

      {capacity == null ? (
        day.count > 0 && (
          <TimingSections day={day} dotBorder={dotBorder} isMatch={isMatch} onSelect={onSelect} />
        )
      ) : (
        // Fills the rest of the cell; MonthGrid measures it to decide how many tiles fit
        <div data-tiles className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,48px)] content-start gap-2">
          {tiles.map((e) => (
            <TickerTile
              key={e.ticker}
              earnings={e}
              dimmed={!isMatch(e)}
              dotBorder={dotBorder}
              showTiming
              onSelect={onSelect}
            />
          ))}
          {hidden > 0 && (
            <MoreTile day={{ ...day, hidden, overflow }} matches={hiddenMatches} onShowMore={onShowMore} />
          )}
        </div>
      )}
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
// Week view row: the date line (38px with its padding and gap) above three sections
const WEEK_ROW_PX = 38 + 3 * SECTION_MIN_PX;

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

// Month view, or one week when `days` holds five. `fit` = squeeze each day into its cell
// with a "+N" tile; off, cells show every company and scroll.
export function MonthGrid({ days, fit = true, filtering, isMatch, onSelect, onShowMore }) {
  const gridRef = useRef(null);
  const measured = useTileCapacity(gridRef);
  const capacity = fit ? measured : null;
  const minRow = fit ? MIN_ROW_PX : WEEK_ROW_PX;
  const weeks = days.length / 5;

  return (
    // Takes the height left between the toolbar and the legend; each week gets an equal share
    <div className="m-6 flex-1 overflow-x-auto border-x border-t" style={{ minHeight: HEADER_ROW_PX + weeks * minRow }}>
      <div
        ref={gridRef}
        className="grid h-full min-w-275 grid-cols-5"
        style={{ gridTemplateRows: `${HEADER_ROW_PX}px repeat(${weeks}, minmax(${minRow}px, 1fr))` }}
      >
        {WEEKDAYS.map((weekday, i) => (
          <div
            key={weekday}
            className={cn(
              "flex items-center justify-between border-b px-4 font-mono text-[11px] font-medium tracking-[0.15em]",
              i < 4 && "border-r"
            )}
          >
            <span className={cn("px-2 py-0.5 text-white", WEEKDAY_BADGES[i])}>{weekday}</span>
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
