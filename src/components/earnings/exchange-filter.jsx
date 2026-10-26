import Link from "next/link";
import { cn } from "@/lib/utils";

// `children` (the calendar toolbar) sits at the right end of the row, and still shows without filters
export function ExchangeFilter({ filters, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-2">
      {filters.length > 0 && (
        <nav aria-label="Filter companies" className="flex flex-wrap items-center gap-3">
          <span className="eyebrow text-muted-foreground">Show</span>
          <div className="flex flex-wrap py-4 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
            {filters.map((filter) => (
              <Link
                key={filter.key}
                href={filter.href}
                scroll={false}
                aria-current={filter.active ? "page" : undefined}
                className={cn(
                  "-ml-px flex h-10 items-center gap-2 border border-line-strong px-4 no-underline first:ml-0",
                  filter.active ? "bg-foreground text-background" : "text-foreground"
                )}
              >
                {filter.label}
                <span className={cn("font-medium", filter.active ? "opacity-70" : "text-muted-foreground")}>
                  {filter.count}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}
      {children}
    </div>
  );
}
