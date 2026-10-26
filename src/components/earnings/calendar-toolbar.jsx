import { ChevronLeftIcon, ChevronRightIcon, Columns3Icon, LayoutGridIcon, ListIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const square = "grid size-10 place-items-center border border-line-strong text-foreground";
const pressed = "bg-foreground text-background";

const SCOPES = [
  { value: "all", label: "All" },
  { value: "watchlist", label: "Watchlist" },
];

const VIEWS = [
  { value: "list", label: "List view", Icon: ListIcon },
  { value: "week", label: "Week view", Icon: Columns3Icon },
  { value: "month", label: "Month view", Icon: LayoutGridIcon },
];

const todayButton = "grid h-10 cursor-pointer place-items-center bg-foreground px-4.5 text-background uppercase";

export function CalendarToolbar({ view, scope, onScopeChange, onToday }) {
  const todayLabel = `Jump to today, ${view.todayLabel}`;

  return (
    <div className="flex flex-wrap items-end justify-between gap-6 px-6 py-3">
      <h1 className="display-type m-0 text-[44px]">
        {view.monthName} <span className="text-blue">earnings</span>.
      </h1>

      <div className="flex flex-wrap gap-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
        <div className="flex">
          <Link href={view.prevHref} aria-label="Previous month" className={square}>
            <ChevronLeftIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </Link>
          {view.isCurrentMonth ? (
            <button type="button" onClick={onToday} aria-label={todayLabel} className={todayButton}>
              Today
            </button>
          ) : (
            <Link href={view.todayHref} aria-label={todayLabel} className={cn(todayButton, "no-underline")}>
              Today
            </Link>
          )}
          <Link href={view.nextHref} aria-label="Next month" className={square}>
            <ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>

        <div className="flex">
          {SCOPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onScopeChange(value)}
              aria-pressed={scope === value}
              className={cn(
                "-ml-px h-10 cursor-pointer border border-line-strong px-4 text-foreground uppercase first:ml-0",
                scope === value && pressed
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex">
          {VIEWS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={value === "month"}
              disabled={value !== "month"}
              className={cn(square, "-ml-px first:ml-0", value === "month" && pressed)}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
