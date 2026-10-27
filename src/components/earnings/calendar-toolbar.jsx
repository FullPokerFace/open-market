"use client";

import { CaseUpperIcon, ChevronLeftIcon, ChevronRightIcon, Columns3Icon, ImageIcon, LayoutGridIcon, SquareIcon } from "lucide-react";
import Link from "next/link";
import { LOGOS_ENABLED, setTileDisplay, useTileDisplay } from "@/lib/tile-display";
import { cn } from "@/lib/utils";

const square = "grid size-10 place-items-center border border-line-strong text-foreground";
const pressed = "bg-foreground text-background";

const VIEWS = [
  { value: "day", label: "Day view", Icon: SquareIcon },
  { value: "week", label: "Week view", Icon: Columns3Icon },
  { value: "month", label: "Month view", Icon: LayoutGridIcon },
];

const currentButton = "grid h-10 cursor-pointer place-items-center bg-foreground px-4.5 text-background uppercase";

export function CalendarToolbar({ view, onToday }) {
  // Shows the month / week / day on screen. On the current one it scrolls to today; on any other it goes back to the current one
  const currentLabel = view.isCurrent ? `Jump to today, ${view.todayLabel}` : `Go to ${view.currentName}`;

  return (
    <div className="flex flex-wrap font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
      <div className="flex">
        <Link href={view.prevHref} aria-label={`Previous ${view.unit}`} className={square}>
          <ChevronLeftIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        </Link>
        {view.isCurrent ? (
          <button type="button" onClick={onToday} aria-label={currentLabel} className={currentButton}>
            {view.label}
          </button>
        ) : (
          <Link href={view.todayHref} aria-label={currentLabel} className={cn(currentButton, "no-underline")}>
            {view.label}
          </Link>
        )}
        <Link href={view.nextHref} aria-label={`Next ${view.unit}`} className={square}>
          <ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>

      <nav aria-label="Calendar view" className="flex">
        {VIEWS.map(({ value, label, Icon }) => (
          <Link
            key={value}
            href={view.viewHrefs[value]}
            scroll={false}
            aria-label={label}
            title={label}
            aria-current={value === view.mode ? "page" : undefined}
            className={cn(square, "-ml-px no-underline first:ml-0", value === view.mode && pressed)}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </div>
  );
}

const DISPLAY_OPTIONS = [
  { value: "logos", label: "Show logos", Icon: ImageIcon },
  { value: "tickers", label: "Show tickers", Icon: CaseUpperIcon },
];

// Company logos (the default) or tickers on the tiles. Real radio inputs (arrow keys move between them), drawn like the view buttons.
// Sits beside "Create list"; hidden without a logo.dev key.
export function TileDisplayToggle() {
  const display = useTileDisplay();
  if (!LOGOS_ENABLED) return null;

  return (
    <div role="radiogroup" aria-label="Tile display" className="flex">
      {DISPLAY_OPTIONS.map(({ value, label, Icon }) => (
        <label
          key={value}
          title={label}
          className={cn(
            square,
            "-ml-px cursor-pointer first:ml-0 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
            value === display && pressed
          )}
        >
          <input
            type="radio"
            name="tile-display"
            value={value}
            checked={value === display}
            onChange={() => setTileDisplay(value)}
            aria-label={label}
            className="sr-only"
          />
          <Icon className="size-3.5" aria-hidden="true" />
        </label>
      ))}
    </div>
  );
}

// "October earnings." / "Week of Oct 26 earnings." / "Monday, Oct 26 earnings." heading above the calendar
export function CalendarTitle({ view }) {
  return (
    <h1 className="display-type m-0 px-6 py-3 text-[44px]">
      {view.title} <span className="text-blue">earnings</span>.
    </h1>
  );
}
