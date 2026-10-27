"use client";

import { useState } from "react";
import { logoUrl, useTileDisplay } from "@/lib/tile-display";
import { cn } from "@/lib/utils";

// Tickers with no logo (or a failed load) this visit, so other tiles, rows and views skip straight to the fallback
const missingLogos = new Set();

// The company's logo while the tickers / logos toggle is on logos; `fallback` otherwise, or when there's no logo
export function CompanyLogo({ ticker, className, fallback = null }) {
  const display = useTileDisplay();
  const [failed, setFailed] = useState(() => missingLogos.has(ticker));
  if (display !== "logos" || failed) return fallback;

  return (
    // Plain img: /api/logo already serves small cached PNGs, so Next's image optimizer would only add cost
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl(ticker)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => {
        missingLogos.add(ticker);
        setFailed(true);
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
