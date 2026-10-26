"use client";

import { cn } from "@/lib/utils";
import { dayColors, TickerTile, WEEKDAY_BADGES } from "./month-grid";

// One day across the whole width: every company that day, scrolling when they don't fit
export function DayView({ day, isMatch, onSelect }) {
  const { background, dotBorder } = dayColors(day);

  return (
    <div
      id={`day-${day.key}`}
      className={cn("m-6 flex flex-1 flex-col border", background, day.isToday && "border-2 border-foreground")}
    >
      <div className="flex h-8 shrink-0 items-center justify-between border-b px-4 font-mono text-[11px] font-medium tracking-[0.15em]">
        <span className={cn("px-2 py-0.5 text-white", WEEKDAY_BADGES[day.weekday])}>0{day.weekday + 1}</span>
        <span className="text-muted-foreground">
          {day.isToday && "TODAY · "}
          {day.count} {day.count === 1 ? "COMPANY" : "COMPANIES"}
        </span>
      </div>

      {/* Positioned so a long day scrolls here instead of stretching the page */}
      <div className="relative min-h-23 flex-1">
        <div className="absolute inset-0 overflow-y-auto px-4 pt-3.5 pb-3">
          {day.count === 0 ? (
            <span className="chip text-muted-foreground">No earnings</span>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,48px)] content-start gap-2">
              {day.earnings.map((e) => (
                <TickerTile key={e.ticker} earnings={e} dimmed={!isMatch(e)} dotBorder={dotBorder} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
