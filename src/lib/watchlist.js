"use client";

// Watchlist saved in the browser (DESIGN.md: localStorage for the MVP).
// One shared store so every component and open tab stays in sync.

import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_WATCHLIST } from "./earnings";

const STORAGE_KEY = "earnings:watchlist";
const listeners = new Set();
// Fallback when storage is blocked (private mode, disabled site data)
let memoryRaw = null;
// Last parsed value, so the snapshot keeps its identity between renders
let cache = { raw: undefined, tickers: DEFAULT_WATCHLIST };

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function parse(raw) {
  // Nothing saved yet: start with the default tickers
  if (raw == null) return DEFAULT_WATCHLIST;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((t) => typeof t === "string") : DEFAULT_WATCHLIST;
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

function getSnapshot() {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, tickers: parse(raw) };
  return cache.tickers;
}

function getServerSnapshot() {
  return DEFAULT_WATCHLIST;
}

function subscribe(listener) {
  listeners.add(listener);
  // Changes made in another tab
  const onStorage = (event) => event.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function save(tickers) {
  const raw = JSON.stringify(tickers);
  memoryRaw = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage unavailable: the list lasts until the page closes
  }
  listeners.forEach((listener) => listener());
}

export function useWatchlist() {
  const tickers = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const set = useMemo(() => new Set(tickers), [tickers]);

  return {
    tickers,
    has: (ticker) => set.has(ticker),
    toggle: (ticker) => {
      const current = getSnapshot();
      save(current.includes(ticker) ? current.filter((t) => t !== ticker) : [...current, ticker]);
    },
  };
}
