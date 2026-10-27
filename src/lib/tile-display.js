"use client";

// What calendar tiles show, "tickers" or "logos", saved in the browser.
// One shared store so every tile and open tab stays in sync.

import { useSyncExternalStore } from "react";
import { logoFileName } from "./logos";

const STORAGE_KEY = "earnings:tile-display";
export const TILE_DISPLAYS = ["logos", "tickers"];
const listeners = new Set();
// Fallback when storage is blocked (private mode, disabled site data)
let memoryValue = null;

// Logos need a logo.dev key on the server; without one, tiles always show tickers and the toggle hides.
// Set in next.config.mjs, so the browser learns only whether there is a key, never the key itself.
export const LOGOS_ENABLED = process.env.LOGOS_ENABLED === "true";
// Logos unless the visitor picked tickers; the server renders this too, so most visitors see no swap on load
const DEFAULT_DISPLAY = LOGOS_ENABLED ? "logos" : "tickers";

function getSnapshot() {
  let value = memoryValue;
  try {
    value = localStorage.getItem(STORAGE_KEY) ?? memoryValue;
  } catch {
    // Storage unavailable: use the in-memory choice
  }
  return LOGOS_ENABLED && TILE_DISPLAYS.includes(value) ? value : DEFAULT_DISPLAY;
}

function getServerSnapshot() {
  return DEFAULT_DISPLAY;
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

export function setTileDisplay(value) {
  memoryValue = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage unavailable: the choice lasts until the page closes
  }
  listeners.forEach((listener) => listener());
}

export function useTileDisplay() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Where to look for a ticker's logo, in order (see logos.js): the committed file on the CDN, then logo.dev
// through /api/logo for one not synced yet. Each answers 404 when it has none.
export function logoUrls(ticker) {
  return [`/logos/${encodeURIComponent(logoFileName(ticker))}`, `/api/logo/${encodeURIComponent(ticker)}`];
}
