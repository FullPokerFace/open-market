"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, MoonIcon, SearchIcon, SunIcon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GITHUB_URL, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { GitHubIcon } from "./github-icon";
import { SearchResults } from "./search-results";
import { SuggestFeatureDialog } from "./suggest-feature-dialog";

const navItem = "px-2.5 py-1 text-foreground no-underline";
const menuItem = "flex h-12 items-center border-b px-6 text-left text-foreground no-underline";
const iconButton = "grid w-12 shrink-0 cursor-pointer place-items-center border-l text-foreground";
const PAGES = [
  { href: "/", label: "Calendar" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/about", label: "About" },
];

// Search only shows on pages that pass its props (the calendar). Whether its results are open is the
// page's state (`searchOpen`), so the calendar can stop dimming non-matches once search is closed.
// Below lg the nav (and GitHub link) moves into a burger menu; search and the theme toggle stay in the bar.
export function SiteHeader({ query, onQueryChange, searchOpen, onSearchOpenChange, results, searchState, onSelectResult }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef(null);
  const showResults = Boolean(searchOpen && query?.trim());

  // Close on a click anywhere outside the search box and its results
  useEffect(() => {
    if (!showResults) return;
    const onPointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) onSearchOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showResults, onSearchOpenChange]);

  const selectResult = (earnings) => {
    onSearchOpenChange(false);
    onSelectResult(earnings);
  };

  const onSearchKeyDown = (event) => {
    if (event.key === "Enter" && showResults && searchState === "ready" && results.length) selectResult(results[0]);
  };

  // The dialog lives here, not in the menu, so closing the menu doesn't unmount it
  const openSuggest = () => {
    setMenuOpen(false);
    setSuggestOpen(true);
  };

  return (
    // relative: on mobile the search results anchor to the full header width
    <header className="eyebrow relative flex min-h-11 items-stretch border-b">
      <Link
        href="/"
        aria-label={`${SITE_NAME} home`}
        className="flex shrink-0 items-center gap-2.5 border-r px-4 text-foreground no-underline"
      >
        <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
          <path d="M1 17L10 1l9 16h-4.5L10 9l-4.5 8z" fill="currentColor" />
        </svg>
        {/* The name only where the bar has room for it */}
        <span className="hidden font-bold lg:inline">{SITE_NAME}</span>
      </Link>

      <nav aria-label="Primary" className="hidden flex-wrap items-center gap-1 px-3 lg:flex">
        {PAGES.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <Fragment key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(navItem, current && "bg-foreground text-background")}
              >
                {label}
              </Link>
              <MenuDivider />
            </Fragment>
          );
        })}
        <button type="button" onClick={openSuggest} className={cn(navItem, "cursor-pointer uppercase")}>
          Suggest a feature
        </button>
      </nav>

      <div className="ml-auto flex min-w-0 flex-1 items-stretch justify-end lg:flex-none">
        {onQueryChange && (
          <div
            ref={searchRef}
            className="flex min-w-0 flex-1 lg:relative lg:flex-none"
            onKeyDown={(e) => e.key === "Escape" && onSearchOpenChange(false)}
            // Tabbing out of the box and its results closes them
            onBlur={(e) => e.relatedTarget && !e.currentTarget.contains(e.relatedTarget) && onSearchOpenChange(false)}
          >
            <label className="flex min-w-0 flex-1 items-center gap-2 border-l px-3.5">
              <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.2} aria-hidden="true" />
              <span className="sr-only">Search ticker or company</span>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  onQueryChange(e.target.value);
                  onSearchOpenChange(true);
                }}
                onFocus={() => onSearchOpenChange(true)}
                onKeyDown={onSearchKeyDown}
                aria-controls={showResults ? "search-results" : undefined}
                placeholder="SEARCH TICKER"
                className="w-full min-w-0 border-0 bg-transparent text-foreground uppercase outline-none placeholder:text-muted-foreground lg:w-37.5"
              />
            </label>
            {showResults && (
              <SearchResults query={query.trim()} results={results} state={searchState} onSelect={selectResult} />
            )}
          </div>
        )}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${SITE_NAME} on GitHub`}
          title="View source on GitHub"
          className={cn(iconButton, "hidden lg:grid")}
        >
          <GitHubIcon className="size-4" />
        </a>
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle dark mode"
          className={iconButton}
        >
          <MoonIcon className="size-3.5 dark:hidden" aria-hidden="true" />
          <SunIcon className="hidden size-3.5 dark:block" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className={cn(iconButton, "lg:hidden")}
        >
          <MenuIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" showCloseButton={false} className="eyebrow gap-0 bg-background">
          <div className="flex min-h-11 items-center justify-between border-b pl-6 text-muted-foreground">
            <SheetTitle className="font-mono text-[11px] font-medium text-muted-foreground">Menu</SheetTitle>
            <SheetClose aria-label="Close menu" className="grid h-11 w-12 cursor-pointer place-items-center border-l text-foreground">
              <XIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            </SheetClose>
          </div>
          <nav aria-label="Primary" className="flex flex-col">
            {PAGES.map(({ href, label }) => {
              const current = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={cn(menuItem, current && "bg-foreground text-background")}
                >
                  {label}
                </Link>
              );
            })}
            <button type="button" onClick={openSuggest} className={cn(menuItem, "cursor-pointer uppercase")}>
              Suggest a feature
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={cn(menuItem, "gap-2.5")}>
              <GitHubIcon className="size-3.5" />
              GitHub ↗
            </a>
          </nav>
        </SheetContent>
      </Sheet>

      <SuggestFeatureDialog open={suggestOpen} onOpenChange={setSuggestOpen} />
    </header>
  );
}

function MenuDivider() {
  return (
    <span aria-hidden="true" className="px-1 text-muted-foreground/50">
      |
    </span>
  );
}
