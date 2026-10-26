"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { SearchResults } from "./search-results";

const navItem = "px-2.5 py-1 text-foreground no-underline";

export function SiteHeader({ query, onQueryChange, results, searchState, onSelectResult, watchlistOnly, onToggleWatchlist }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [resultsOpen, setResultsOpen] = useState(false);
  const searchRef = useRef(null);
  const showResults = resultsOpen && query.trim() !== "";

  // Close on a click anywhere outside the search box and its results
  useEffect(() => {
    if (!showResults) return;
    const onPointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) setResultsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showResults]);

  const selectResult = (earnings) => {
    setResultsOpen(false);
    onSelectResult(earnings);
  };

  const onSearchKeyDown = (event) => {
    if (event.key === "Enter" && showResults && searchState === "ready" && results.length) selectResult(results[0]);
  };

  return (
    <header className="eyebrow flex min-h-11 flex-wrap items-stretch border-b">
      <Link href="/" aria-label="Earnings home" className="grid w-13 place-items-center border-r text-foreground">
        <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
          <path d="M1 17L10 1l9 16h-4.5L10 9l-4.5 8z" fill="currentColor" />
        </svg>
      </Link>

      <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 px-3">
        <Link href="/" aria-current="page" className={cn(navItem, "bg-foreground text-background")}>
          Calendar
        </Link>
        <button
          type="button"
          onClick={onToggleWatchlist}
          aria-pressed={watchlistOnly}
          className={cn(navItem, "cursor-pointer uppercase", watchlistOnly && "bg-foreground text-background")}
        >
          Watchlist
        </button>
        <Link href="/" className={navItem}>
          Insights
        </Link>
      </nav>

      <div className="ml-auto flex items-stretch">
        <div
          ref={searchRef}
          className="relative flex"
          onKeyDown={(e) => e.key === "Escape" && setResultsOpen(false)}
          // Tabbing out of the box and its results closes them
          onBlur={(e) => e.relatedTarget && !e.currentTarget.contains(e.relatedTarget) && setResultsOpen(false)}
        >
          <label className="flex items-center gap-2 border-l px-3.5">
            <SearchIcon className="size-3.5 text-muted-foreground" strokeWidth={2.2} aria-hidden="true" />
            <span className="sr-only">Search ticker or company</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                setResultsOpen(true);
              }}
              onFocus={() => setResultsOpen(true)}
              onKeyDown={onSearchKeyDown}
              aria-controls={showResults ? "search-results" : undefined}
              placeholder="SEARCH TICKER"
              className="w-37.5 border-0 bg-transparent text-foreground uppercase outline-none placeholder:text-muted-foreground"
            />
          </label>
          {showResults && (
            <SearchResults
              query={query.trim()}
              results={results}
              state={searchState}
              onSelect={selectResult}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle dark mode"
          className="grid w-12 cursor-pointer place-items-center border-l text-foreground"
        >
          <MoonIcon className="size-3.5 dark:hidden" aria-hidden="true" />
          <SunIcon className="hidden size-3.5 dark:block" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
