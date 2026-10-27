"use client";

import { useId } from "react";
import { Title } from "@/components/ui/title";
import { cn } from "@/lib/utils";
import { WEEKDAY_BADGES } from "./month-grid";
import { dayColors, TickerTile, TodayDot } from "./ticker-tile";
import { liveSection, NowBadge, sectionProgress, splitByTiming, useNewYorkMinutes } from "./timing-sections";

function DayColumn({ section, dotBorder, progress, live, minutes, isMatch, onSelect }) {
  const headingId = useId();
  const { Icon } = section;
  const count = section.earnings.length;

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col border-b last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0">
      {/* The three bars side by side (stacked on mobile) read as one trading day, filled up to now */}
      <div className={cn("relative h-1.5", section.track)} aria-hidden="true">
        <div className={cn("h-full", section.bar)} style={{ width: `${progress * 100}%` }} />
        {live && (
          <span
            className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 bg-foreground"
            style={{ left: `${progress * 100}%` }}
          />
        )}
      </div>

      <header className="flex items-start gap-3 border-b px-5 pt-4 pb-3.5">
        <span className={cn("grid size-10 shrink-0 place-items-center", section.tint)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Title id={headingId} level={2} size="2xl" className="m-0">
            {section.title}
          </Title>
          <p className="eyebrow m-0 mt-1 truncate text-muted-foreground">
            {section.hours} · {section.hint}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="display-type text-2xl">{String(count).padStart(2, "0")}</span>
          {live && <NowBadge minutes={minutes} />}
        </div>
      </header>

      {/* From md, positioned so a long list scrolls here instead of stretching the page; stacked on mobile it just grows */}
      <div className={cn("relative min-h-23 flex-1", count > 0 && section.tint)}>
        <div className="px-5 pt-3.5 pb-3 md:absolute md:inset-0 md:overflow-y-auto">
          {count === 0 ? (
            <span className="chip text-muted-foreground">None scheduled</span>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,48px)] content-start gap-2">
              {section.earnings.map((e) => (
                <TickerTile key={e.ticker} earnings={e} dimmed={!isMatch(e)} dotBorder={dotBorder} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// One day across the whole width, split by when each company reports; below md the sections stack top to bottom
export function DayView({ day, isMatch, onSelect }) {
  const { background, dotBorder } = dayColors(day);
  const minutes = useNewYorkMinutes();
  const live = liveSection(day, minutes);

  return (
    <div
      id={`day-${day.key}`}
      className={cn("m-6 flex flex-1 flex-col border", background, day.isToday && "border-2 border-foreground")}
    >
      <div className="flex h-8 shrink-0 items-center justify-between border-b px-4 font-mono text-[11px] font-medium tracking-[0.15em]">
        <span className={cn("px-2 py-0.5 text-white", WEEKDAY_BADGES[day.weekday])}>0{day.weekday + 1}</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {day.isToday && (
            <>
              <TodayDot />
              <span className="text-foreground">TODAY</span> ·
            </>
          )}
          {day.count} {day.count === 1 ? "COMPANY" : "COMPANIES"}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-3">
        {splitByTiming(day.earnings).map((section) => (
          <DayColumn
            key={section.key}
            section={section}
            dotBorder={dotBorder}
            progress={sectionProgress(section, day, minutes)}
            live={live === section.key}
            minutes={minutes}
            isMatch={isMatch}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
