import { ChevronLeftIcon, ChevronRightIcon, Columns3Icon, LayoutGridIcon, ListIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const square = "grid size-10 place-items-center border border-line-strong text-foreground";
const pressed = "bg-foreground text-background";

const VIEWS = [
  { value: "list", label: "List view", Icon: ListIcon },
  { value: "week", label: "Week view", Icon: Columns3Icon },
  { value: "month", label: "Month view", Icon: LayoutGridIcon },
];

const currentButton = "grid h-10 cursor-pointer place-items-center bg-foreground px-4.5 text-background uppercase";

export function CalendarToolbar({ view, scope, onScopeChange, onToday }) {
  // Shows the month on screen. On the current month it scrolls to today; on any other month it goes back to the current one
  const currentLabel = view.isCurrentMonth ? `Jump to today, ${view.todayLabel}` : `Go to ${view.currentMonthName}`;

  return (
    <div className="flex flex-wrap gap-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
      <div className="flex">
        <Link href={view.prevHref} aria-label="Previous month" className={square}>
          <ChevronLeftIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        </Link>
        {view.isCurrentMonth ? (
          <button type="button" onClick={onToday} aria-label={currentLabel} className={currentButton}>
            {view.label}
          </button>
        ) : (
          <Link href={view.todayHref} aria-label={currentLabel} className={cn(currentButton, "no-underline")}>
            {view.label}
          </Link>
        )}
        <Link href={view.nextHref} aria-label="Next month" className={square}>
          <ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        </Link>
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
  );
}

// "October earnings." heading above the grid
export function CalendarTitle({ view }) {
  return (
    <h1 className="display-type m-0 px-6 py-3 text-[44px]">
      {view.monthName} <span className="text-blue">earnings</span>.
    </h1>
  );
}
