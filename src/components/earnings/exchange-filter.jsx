"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// `children` (the calendar toolbar) sits at the right end of the row, and still shows without filters.
// Below md the exchange buttons collapse into a dropdown.
export function ExchangeFilter({ filters, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-2">
      {filters.length > 0 && (
        <nav aria-label="Filter companies" className="flex flex-wrap items-center gap-3">
          <span className="eyebrow text-muted-foreground">Show</span>
          <ExchangeSelect filters={filters} />
          <div className="hidden flex-wrap py-4 font-mono text-[11px] font-bold tracking-[0.12em] uppercase md:flex">
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

// Native select so phones get their own picker; choosing an exchange navigates like the buttons do
function ExchangeSelect({ filters }) {
  const router = useRouter();
  const active = filters.find((filter) => filter.active) ?? filters[0];

  return (
    <label className="relative flex md:hidden">
      <span className="sr-only">Exchange</span>
      <select
        value={active.key}
        onChange={(e) => router.push(filters.find((filter) => filter.key === e.target.value).href, { scroll: false })}
        className="h-10 cursor-pointer appearance-none border border-line-strong bg-background pr-10 pl-4 font-mono text-[11px] font-bold tracking-[0.12em] text-foreground uppercase"
      >
        {filters.map((filter) => (
          <option key={filter.key} value={filter.key}>
            {filter.label} · {filter.count}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-foreground"
        strokeWidth={2.2}
        aria-hidden="true"
      />
    </label>
  );
}
