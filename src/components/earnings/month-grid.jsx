"use client";

import { Fragment, useLayoutEffect, useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { dayColors, TickerTile, TodayDot } from "./ticker-tile";
import { SECTION_MIN_PX, TimingSections } from "./timing-sections";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"];
export const WEEKDAY_BADGES = ["bg-badge-1", "bg-badge-2", "bg-badge-3", "bg-badge-4", "bg-badge-5"];

// Shared by a month / week cell and the day view of the same date, so one morphs into the other
export const dayTransitionName = (key) => `day-${key}`;

// `matches`: how many hidden companies pass the search, or null when nothing is filtered
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

// Days the mobile agenda folds into one line. Today always keeps its own row, so "jump to today" has somewhere to land.
const isFoldedEmpty = (day) => day.inPeriod && day.count === 0 && !day.isToday;

// Back-to-back folded days, keyed by the index of each run's first day
function emptyRuns(days) {
  const runs = {};
  let start = null;
  days.forEach((day, i) => {
    if (!isFoldedEmpty(day)) start = null;
    else if (start == null) runs[(start = i)] = [day];
    else runs[start].push(day);
  });
  return runs;
}

// Mobile agenda only: one muted line standing in for a run of days without earnings
function EmptyRun({ days }) {
  const first = days[0];
  const last = days.at(-1);
  const name = (day) => `${WEEKDAYS[day.weekday]} ${day.label}`;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b px-4 py-2.5 font-mono text-[11px] font-medium tracking-[0.15em] text-muted-foreground md:hidden",
        dayColors(first).background
      )}
    >
      <span>
        {name(first)}
        {days.length > 1 && ` – ${name(last)}`}
      </span>
      <span>NO EARNINGS</span>
    </div>
  );
}

// `capacity` null = week view: every company, split by report time, scrolling inside the cell.
// Clicking the cell (not a tile or "+N") opens the day view, which grows out of the cell: both carry
// the same view-transition name (see DayView). The date is a real link for keyboards and new tabs.
function DayCell({ day, capacity, isLastColumn, filtering, isMatch, onSelect, onShowMore }) {
  const { background, dotBorder } = dayColors(day);
  const router = useRouter();
  const openDay = (event) => {
    if (event.target.closest("a, button")) return;
    router.push(day.dayHref);
  };

  // Tiles that fit this cell; past that, the last slot becomes "+N". The server already
  // holds back companies beyond 16 (`hiddenIndex`); `overflow` is what this screen can't fit.
  const shownCount = capacity != null && day.count > capacity ? capacity - 1 : day.count;
  const tiles = day.earnings.slice(0, shownCount);
  const overflow = day.earnings.slice(shownCount);
  const hidden = day.count - tiles.length;
  const hiddenMatches = filtering ? [...overflow, ...day.hiddenIndex].filter(isMatch).length : null;

  return (
    // onClick is a mouse shortcut only: the date link below is the keyboard and screen-reader way in
    <div
      id={`day-${day.key}`}
      onClick={openDay}
      className={cn(
        // contain:size keeps tiles from stretching the row: rows split the height, tiles adapt.
        // Below md the cell is a full-width agenda row that grows with its tiles.
        "group/day flex min-h-0 cursor-pointer flex-col gap-2 border-b px-4 pt-2.5 pb-2 md:overflow-hidden md:contain-[size]",
        background,
        !isLastColumn && "md:border-r",
        // The agenda lists only the period's own days, not the next/previous month's padding;
        // empty days there are folded into an EmptyRun line
        (!day.inPeriod || isFoldedEmpty(day)) && "max-md:hidden",
        // Inset outline so the thicker frame doesn't shift the grid; outlines paint over the week view's tinted sections
        day.isToday && "outline-2 -outline-offset-2 outline-foreground"
      )}
    >
      {/* Sticks to the top of the screen in the agenda while its day's tiles scroll by */}
      <div
        className={cn(
          "flex min-h-5 items-center justify-between font-mono text-[11px] font-medium tracking-[0.15em] max-md:sticky max-md:top-0 max-md:z-10 max-md:py-2.5",
          // Bleeds to the cell's edges so tiles don't show beside it; on today it stops inside the 2px frame
          day.isToday
            ? "max-md:-mx-3.5 max-md:-mt-2 max-md:px-3.5"
            : "max-md:-mx-4 max-md:-mt-2.5 max-md:px-4",
          background
        )}
      >
        <Link
          href={day.dayHref}
          aria-label={`Open ${day.longLabel} in day view`}
          className="flex items-center gap-2 no-underline decoration-1 underline-offset-4 group-hover/day:underline"
        >
          {/* No weekday column headers in the agenda, so each day carries its own */}
          <span className={cn("px-2 py-0.5 text-white md:hidden", WEEKDAY_BADGES[day.weekday])}>
            {WEEKDAYS[day.weekday]}
          </span>
          {day.isToday ? (
            <span className="flex items-center gap-2 bg-foreground px-2 py-0.5 text-background">
              <TodayDot />
              {day.label} · TODAY
            </span>
          ) : (
            <span className={day.inPeriod ? "text-foreground" : "text-muted-foreground"}>{day.label}</span>
          )}
        </Link>
        {!day.isToday && day.count > 0 && (
          <span className="text-muted-foreground">{String(day.count).padStart(2, "0")}</span>
        )}
        {day.count === 0 && <span className="text-muted-foreground md:hidden">NO EARNINGS</span>}
      </div>

      {/* The agenda says it on the date line instead, keeping empty days one line tall */}
      {day.count === 0 && <span className="chip self-start text-muted-foreground max-md:hidden">No earnings</span>}

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

// How many tiles fit one day cell, re-measured whenever a cell's tile area changes size.
// Every cell is the same size; cells showing "No earnings" have less room but no tiles.
// Month and week share this component, so it measures again on every switch back to month (`fit`, `days`):
// the grid itself can come back the same size, or from being hidden, while its cells don't.
function useTileCapacity(gridRef, fit, days) {
  const [capacity, setCapacity] = useState(MAX_TILES);

  useLayoutEffect(() => {
    if (!fit) return;
    const grid = gridRef.current;
    const wide = window.matchMedia("(min-width: 48rem)");
    const measure = () => {
      // The agenda below md grows with its tiles, so it shows every one the server sent
      if (!wide.matches) return setCapacity(MAX_TILES);
      const boxes = [...grid.querySelectorAll("[data-tiles]")];
      if (!boxes.length) return;
      const height = Math.max(...boxes.map((box) => box.clientHeight));
      setCapacity(Math.min(MAX_TILES, tilesAcross(boxes[0].clientWidth) * tilesAcross(height)));
    };
    measure();
    // The tile areas are sized by their cells (contain:size), not by the tiles, so this can't loop
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    grid.querySelectorAll("[data-tiles]").forEach((box) => observer.observe(box));
    return () => observer.disconnect();
  }, [gridRef, fit, days]);

  return capacity;
}

// Month view, or one week when `days` holds five. `fit` = squeeze each day into its cell
// with a "+N" tile; off, cells show every company and scroll.
export function MonthGrid({ days, fit = true, filtering, isMatch, onSelect, onShowMore }) {
  const gridRef = useRef(null);
  const measured = useTileCapacity(gridRef, fit, days);
  const capacity = fit ? measured : null;
  const minRow = fit ? MIN_ROW_PX : WEEK_ROW_PX;
  const weeks = days.length / 5;
  const runs = emptyRuns(days);

  return (
    // Takes the height left between the toolbar and the legend; each week gets an equal share.
    // Below md it's an agenda instead: one day per row, scrolling with the page (no overflow here, so date lines can stick).
    <div
      className="m-6 flex-1 border-x border-t md:min-h-(--grid-min) md:overflow-x-auto"
      style={{ "--grid-min": `${HEADER_ROW_PX + weeks * minRow}px` }}
    >
      <div
        ref={gridRef}
        className="flex h-full flex-col md:grid md:min-w-275 md:grid-cols-5 md:grid-rows-(--grid-rows)"
        style={{ "--grid-rows": `${HEADER_ROW_PX}px repeat(${weeks}, minmax(${minRow}px, 1fr))` }}
      >
        {WEEKDAYS.map((weekday, i) => (
          <div
            key={weekday}
            className={cn(
              "hidden items-center justify-between border-b px-4 font-mono text-[11px] font-medium tracking-[0.15em] md:flex",
              i < 4 && "border-r"
            )}
          >
            <span className={cn("px-2 py-0.5 text-white", WEEKDAY_BADGES[i])}>{weekday}</span>
          </div>
        ))}
        {days.map((day, i) => (
          // md:hidden run lines take no grid slot, so the desktop columns stay in step
          <Fragment key={day.key}>
            {runs[i] && <EmptyRun days={runs[i]} />}
            {/* default="none": only the cell ↔ day view morph animates, not every navigation */}
            <ViewTransition name={dayTransitionName(day.key)} share="day-morph" default="none">
              <DayCell
                day={day}
                capacity={capacity}
                isLastColumn={i % 5 === 4}
                filtering={filtering}
                isMatch={isMatch}
                onSelect={onSelect}
                onShowMore={onShowMore}
              />
            </ViewTransition>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
