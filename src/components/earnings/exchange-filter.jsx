import Link from "next/link";
import { cn } from "@/lib/utils";

export function ExchangeFilter({ filters }) {
  if (!filters.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
      <nav aria-label="Filter by exchange" className="flex flex-wrap items-center gap-3">
        <span className="eyebrow text-muted-foreground">Exchange</span>
        <div className="flex flex-wrap font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
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
      <span className="eyebrow text-muted-foreground">OTC &amp; closed-end funds excluded</span>
    </div>
  );
}
