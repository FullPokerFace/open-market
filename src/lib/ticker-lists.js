"use client";

// The visitor's own ticker lists (the "+" beside the exchange filter), saved in the browser like the watchlist.
// One shared store so every component and open tab stays in sync.

import { useSyncExternalStore } from "react";
import { LIST_COOKIE } from "./earnings";

const STORAGE_KEY = "earnings:lists";
export const LIST_NAME_MAX = 20;
const NO_LISTS = [];
const listeners = new Set();
// Fallback when storage is blocked (private mode, disabled site data)
let memoryRaw = null;
// Last parsed value, so the snapshot keeps its identity between renders
let cache = { raw: undefined, lists: NO_LISTS };

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function parse(raw) {
  if (raw == null) return NO_LISTS;
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return NO_LISTS;
    return value.filter(
      (list) => typeof list?.id === "string" && typeof list.name === "string" && Array.isArray(list.tickers)
    );
  } catch {
    return NO_LISTS;
  }
}

function getSnapshot() {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, lists: parse(raw) };
  return cache.lists;
}

function getServerSnapshot() {
  return NO_LISTS;
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

function save(lists) {
  const raw = JSON.stringify(lists);
  memoryRaw = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage unavailable: the lists last until the page closes
  }
  listeners.forEach((listener) => listener());
}

const YEAR_SECONDS = 365 * 24 * 60 * 60;

// Remembers the list picked (its tickers), or forgets it with null when a market is picked instead
export function rememberList(tickers) {
  document.cookie = tickers
    ? `${LIST_COOKIE}=${encodeURIComponent(tickers.join(","))}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`
    : `${LIST_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function useTickerLists() {
  const lists = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    lists,
    // Returns the new list so the caller can switch to it
    create: (name, tickers) => {
      const list = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim().slice(0, LIST_NAME_MAX),
        tickers,
      };
      save([...getSnapshot(), list]);
      return list;
    },
  };
}
