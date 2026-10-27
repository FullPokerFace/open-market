"use client";

import { useState } from "react";
import MISSING_LOGOS from "@/lib/logo-missing.json";
import { logoUrls, useTileDisplay } from "@/lib/tile-display";
import { cn } from "@/lib/utils";

// Tickers with no logo: the synced list, plus any that failed every source this visit,
// so other tiles, rows and views skip straight to the fallback
const missingLogos = new Set(MISSING_LOGOS);

// The company's logo while the tickers / logos toggle is on logos; `fallback` otherwise, or when there's no logo.
// Tries each of logoUrls() in turn as the one before fails to load.
export function CompanyLogo({ ticker, className, fallback = null }) {
  const display = useTileDisplay();
  const sources = logoUrls(ticker);
  const [source, setSource] = useState(() => (missingLogos.has(ticker) ? sources.length : 0));
  if (display !== "logos" || source >= sources.length) return fallback;

  return (
    // Plain img: the logos are already small PNGs, so Next's image optimizer would only add cost
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[source]}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => {
        if (source + 1 >= sources.length) missingLogos.add(ticker);
        setSource(source + 1);
      }}
      className={cn("object-contain", className)}
    />
  );
}

// Ticker for list rows, with a small logo before it in logos mode.
// Rows without a logo keep an empty slot, so tickers stay lined up.
export function TickerLabel({ ticker, className }) {
  const display = useTileDisplay();

  return (
    <span className={cn("flex min-w-0 items-center gap-2 font-mono text-xs font-bold text-strong", className)}>
      {display === "logos" && (
        <CompanyLogo ticker={ticker} className="size-5 shrink-0" fallback={<span aria-hidden="true" className="size-5 shrink-0" />} />
      )}
      {ticker}
    </span>
  );
}
