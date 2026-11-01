"use client";

// The visitor's own ticker lists (the "+" beside the exchange filter, or the picker in the details sheet), saved in the browser.
// One shared store so every component and open tab stays in sync.
//
// Signed in (only needed for earnings notifications), the lists are also saved to the account: the first time a
// browser meets the account its lists are merged with the saved ones, every change after that is sent to
// /api/watchlists, and each visit starts from the saved copy so changes made on another device show up.

import { useSyncExternalStore } from "react";
import { LIST_COOKIE } from "./earnings";
import { cleanLists, LIST_NAME_MAX, MAX_LISTS, MAX_TICKERS, mergeLists } from "./watchlist-rules";

export { LIST_NAME_MAX, MAX_LISTS, MAX_TICKERS };

const STORAGE_KEY = "earnings:lists";
// Id of the account these lists are saved to, while signed in
const ACCOUNT_KEY = "earnings:lists-account";
// Set while a change hasn't reached the account yet (offline, closed tab); it's sent on the next visit
const UNSAVED_KEY = "earnings:lists-unsaved";
const NO_LISTS = [];
const listeners = new Set();
// Fallback when storage is blocked (private mode, disabled site data)
let memoryRaw = null;
// Last parsed value, so the snapshot keeps its identity between renders
let cache = { raw: undefined, lists: NO_LISTS };

function readKey(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: nothing to remember between visits
  }
}

function readRaw() {
  return readKey(STORAGE_KEY) ?? memoryRaw;
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
  resumeAccount();
  // Changes made in another tab
  const onStorage = (event) => event.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// Saves the lists in this browser only
function writeLocal(lists) {
  const raw = JSON.stringify(lists);
  memoryRaw = raw;
  writeKey(STORAGE_KEY, raw);
  listeners.forEach((listener) => listener());
}

// ---- Saving to the account ----

// The signed-in account the lists are saved to, or null
let account = null;
// Counts local changes, so a save that finishes late can tell whether newer changes are still waiting
let version = 0;
let pushTimer = null;
let resumed = false;
let linking = null;

// A change by the visitor: saved here, and sent to the account shortly after (changes in a row go together)
function save(lists) {
  version += 1;
  writeLocal(lists);
  if (!account) return;
  writeKey(UNSAVED_KEY, "1");
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 400);
}

async function push() {
  clearTimeout(pushTimer);
  pushTimer = null;
  if (!account) return;
  const sent = version;
  try {
    const res = await fetch("/api/watchlists", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lists: cleanLists(getSnapshot()) }),
      // Still sent when the change was the last thing before closing the tab
      keepalive: true,
    });
    if (res.status === 401) return forgetAccount();
    if (res.ok && version === sent) writeKey(UNSAVED_KEY, null);
  } catch {
    // Offline: still marked unsaved, so the next visit sends it
  }
}

async function fetchSaved() {
  const res = await fetch("/api/watchlists", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Couldn't load your saved watchlists.");
  return res.json();
}

// On each visit of a browser already linked to an account: start from the saved lists (changed on another
// device, or by an unsubscribe link), unless this browser has changes that never reached the account
async function resumeAccount() {
  if (resumed) return;
  resumed = true;
  const linked = readKey(ACCOUNT_KEY);
  if (!linked) return;
  account = linked;
  const before = version;
  try {
    const saved = await fetchSaved();
    if (!saved) return forgetAccount();
    if (saved.userId !== linked) return linkAccount(saved.userId);
    if (readKey(UNSAVED_KEY) || version !== before) return push();
    writeLocal(saved.lists);
  } catch {
    // Offline: keep using this browser's copy
  }
}

// After signing in: merges this browser's lists with the account's saved ones and links the two.
// Resolves once the merged lists are saved; throws if the saved lists couldn't be loaded.
export function linkAccount(userId) {
  if (account === userId && readKey(ACCOUNT_KEY) === userId) return Promise.resolve();
  linking ??= (async () => {
    try {
      const saved = await fetchSaved();
      if (!saved) throw new Error("You're not signed in.");
      account = saved.userId;
      writeKey(ACCOUNT_KEY, saved.userId);
      version += 1;
      writeLocal(mergeLists(saved.lists, cleanLists(getSnapshot())));
      writeKey(UNSAVED_KEY, "1");
      await push();
    } finally {
      linking = null;
    }
  })();
  return linking;
}

// After signing out or when the session ends: the lists stay in this browser, and are no longer saved to the account.
// `notificationsOff` also turns off every list's notifications here (the account was deleted).
export function forgetAccount({ notificationsOff = false } = {}) {
  account = null;
  clearTimeout(pushTimer);
  writeKey(ACCOUNT_KEY, null);
  writeKey(UNSAVED_KEY, null);
  if (notificationsOff) writeLocal(getSnapshot().map((list) => ({ ...list, notify: false })));
}

// The account id the lists are saved to, or null; read in event handlers, not while rendering
export function linkedAccount() {
  return readKey(ACCOUNT_KEY);
}

// ---- Calendar cookie ----

const YEAR_SECONDS = 365 * 24 * 60 * 60;

// Remembers the list picked (its tickers), or forgets it with null when a market is picked instead
export function rememberList(tickers) {
  document.cookie = tickers
    ? `${LIST_COOKIE}=${encodeURIComponent(tickers.join(","))}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`
    : `${LIST_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

function sameTickers(a, b) {
  return [...a].sort().join(",") === [...b].sort().join(",");
}

// The tickers the calendar opens with (the remembered list), or null
function rememberedTickers() {
  const value = document.cookie.split("; ").find((c) => c.startsWith(`${LIST_COOKIE}=`))?.slice(LIST_COOKIE.length + 1);
  if (!value) return null;
  try {
    return decodeURIComponent(value).split(",");
  } catch {
    return null;
  }
}

// Replaces one list (null deletes it); returns the new one. The calendar's remembered list follows along.
function replace(id, change) {
  const old = getSnapshot().find((list) => list.id === id);
  if (!old) return null;
  const updated = change(old);
  if (updated === old) return old;
  save(getSnapshot().flatMap((list) => (list.id !== id ? [list] : updated ? [updated] : [])));

  const remembered = rememberedTickers();
  if (remembered && sameTickers(remembered, old.tickers)) rememberList(updated?.tickers ?? null);
  return updated;
}

export function useTickerLists() {
  const lists = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    lists,
    // Returns the new list so the caller can switch to it, or null at MAX_LISTS
    create: (name, tickers) => {
      if (getSnapshot().length >= MAX_LISTS) return null;
      const list = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim().slice(0, LIST_NAME_MAX),
        tickers: tickers.slice(0, MAX_TICKERS),
        notify: false,
      };
      save([...getSnapshot(), list]);
      return list;
    },
    // Renames the list and sets its companies; returns the updated list
    update: (id, name, tickers) =>
      replace(id, (list) => ({ ...list, name: name.trim().slice(0, LIST_NAME_MAX), tickers: tickers.slice(0, MAX_TICKERS) })),
    // Adds the ticker to the list (not past MAX_TICKERS), or takes it out; returns the updated list
    toggle: (id, ticker) =>
      replace(id, (list) => {
        if (list.tickers.includes(ticker)) return { ...list, tickers: list.tickers.filter((t) => t !== ticker) };
        if (list.tickers.length >= MAX_TICKERS) return list;
        return { ...list, tickers: [...list.tickers, ticker] };
      }),
    // Earnings notification emails for the list on or off (needs an account; see the Watchlists page)
    setNotify: (id, notify) => replace(id, (list) => ({ ...list, notify })),
    remove: (id) => {
      replace(id, () => null);
    },
  };
}
