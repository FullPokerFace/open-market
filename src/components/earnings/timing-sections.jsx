"use client";

import { useId, useSyncExternalStore } from "react";
import { Title } from "@/components/ui/title";
import { cn } from "@/lib/utils";
import { TickerTile } from "./ticker-tile";
import { AfterCloseIcon, BeforeOpenIcon, DuringHoursIcon } from "./timing-icons";

// A trading day in report-time order. `from`/`to` are minutes after midnight ET
// (extended hours run 4:00–20:00), used to fill each section's bar as the day goes.
// Finnhub's rare "during market hours" goes in the middle with companies that haven't set a time.
// Shortest a week view section gets; past that, sections share the cell in thirds
export const SECTION_MIN_PX = 200;

export const TIMING_SECTIONS = [
  {
    key: "before",
    title: "Before open",
    hours: "4:00 – 9:30 ET",
    hint: "pre-market",
    from: 240,
    to: 570,
    Icon: BeforeOpenIcon,
    bar: "bg-badge-4",
    edge: "border-l-badge-4",
    track: "bg-badge-4/20",
    tint: "bg-badge-4/6",
    match: (e) => e.timing === "BMO",
  },
  {
    key: "during",
    title: "During / TBD",
    hours: "9:30 – 16:00 ET",
    hint: "or no time set",
    from: 570,
    to: 960,
    Icon: DuringHoursIcon,
    bar: "bg-badge-5",
    edge: "border-l-badge-5",
    track: "bg-badge-5/20",
    tint: "bg-badge-5/6",
    match: (e) => e.timing !== "BMO" && e.timing !== "AMC",
  },
  {
    key: "after",
    title: "After close",
    hours: "16:00 – 20:00 ET",
    hint: "after hours",
    from: 960,
    to: 1200,
    Icon: AfterCloseIcon,
    bar: "bg-badge-3",
    edge: "border-l-badge-3",
    track: "bg-badge-3/20",
    tint: "bg-badge-3/6",
    match: (e) => e.timing === "AMC",
  },
];

export function splitByTiming(earnings) {
  return TIMING_SECTIONS.map((section) => ({ ...section, earnings: earnings.filter(section.match) }));
}

// Minutes after midnight on Wall Street, ticking every 30s. null while server rendering,
// so the server HTML and the first client render agree.
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const readMinutes = () => {
  const [hour, minute] = clock.format(new Date()).split(":").map(Number);
  return hour * 60 + minute;
};
const subscribeMinutes = (onChange) => {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
};

export function useNewYorkMinutes() {
  return useSyncExternalStore(subscribeMinutes, readMinutes, () => null);
}

export function formatMinutes(minutes) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

// How far through a section the day is, 0–1: past days are done, future days haven't started
export function sectionProgress(section, day, minutes) {
  if (!day.isToday) return day.isPast ? 1 : 0;
  if (minutes == null) return 0;
  return Math.min(1, Math.max(0, (minutes - section.from) / (section.to - section.from)));
}

// The section happening right now, only on today
export function liveSection(day, minutes) {
  if (!day.isToday || minutes == null) return null;
  if (minutes < 570) return "before";
  return minutes < 960 ? "during" : "after";
}

export function NowBadge({ minutes }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.12em] text-foreground">
      <span aria-hidden="true" className="size-1.5 animate-release-pulse rounded-full bg-blue" />
      NOW{minutes != null && ` · ${formatMinutes(minutes)}`}
    </span>
  );
}

function WeekSection({ section, dotBorder, live, minutes, isMatch, onSelect }) {
  const headingId = useId();
  const { Icon } = section;
  const empty = section.earnings.length === 0;

  return (
    <section aria-labelledby={headingId} className="flex min-h-0 flex-col">
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 border-t border-l-2 py-1 pr-4 pl-3.5",
          empty ? "border-l-transparent opacity-50" : section.edge
        )}
      >
        <Icon className="size-3.5 shrink-0" />
        <Title id={headingId} level={3} size="sm" className="m-0 truncate text-[13px] tracking-[-0.02em]">
          {section.title}
        </Title>
        <span className="ml-auto flex items-center gap-2">
          {live && <NowBadge minutes={minutes} />}
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {empty ? "—" : String(section.earnings.length).padStart(2, "0")}
          </span>
        </span>
      </div>
      {/* Fills the section's third of the cell and scrolls on its own; in the mobile agenda it just grows */}
      <div className={cn("min-h-0 flex-1 md:overflow-y-auto", !empty && section.tint)}>
        {!empty && (
          // Top padding leaves room for the status dots that poke out of the first row
          <div className="grid grid-cols-[repeat(auto-fill,48px)] gap-2 px-4 pt-2 pb-3">
            {section.earnings.map((e) => (
              <TickerTile key={e.ticker} earnings={e} dimmed={!isMatch(e)} dotBorder={dotBorder} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Week view cell body: the day's companies in three sections, each a third of the height or SECTION_MIN_PX,
// whichever is taller. Below md (the agenda) each section is only as tall as its tiles.
export function TimingSections({ day, dotBorder, isMatch, onSelect }) {
  const minutes = useNewYorkMinutes();
  const live = liveSection(day, minutes);

  return (
    // Bleeds to the cell's edges so the section bars and tints run full width
    <div
      className="-mx-4 -mb-2 grid min-h-0 flex-1 md:grid-rows-(--section-rows)"
      style={{ "--section-rows": `repeat(3, minmax(${SECTION_MIN_PX}px, 1fr))` }}
    >
      {splitByTiming(day.earnings).map((section) => (
        <WeekSection
          key={section.key}
          section={section}
          dotBorder={dotBorder}
          live={live === section.key}
          minutes={minutes}
          isMatch={isMatch}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
