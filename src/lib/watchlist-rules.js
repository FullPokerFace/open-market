// Watchlist limits and cleanup, shared by the browser store (ticker-lists.js) and the server (/api/watchlists),
// so a list the page allows is always one the server accepts.

export const LIST_NAME_MAX = 20;
export const MAX_LISTS = 20;
export const MAX_TICKERS = 50;

const TICKER = /^[A-Z0-9.-]{1,10}$/;
const LIST_ID = /^[a-z0-9]{1,40}$/;

// [{ id, name, tickers, notify }] from anything list-shaped: bad entries are dropped, duplicates removed and
// everything cut to the limits above. Used on what the browser sends and on what's read back from storage.
export function cleanLists(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const lists = [];
  for (const list of value) {
    if (lists.length >= MAX_LISTS) break;
    if (typeof list?.id !== "string" || !LIST_ID.test(list.id) || seen.has(list.id)) continue;
    const name = typeof list.name === "string" ? list.name.trim().slice(0, LIST_NAME_MAX) : "";
    if (!name || !Array.isArray(list.tickers)) continue;
    const tickers = [...new Set(list.tickers.filter((t) => typeof t === "string" && TICKER.test(t)))].slice(0, MAX_TICKERS);
    seen.add(list.id);
    lists.push({ id: list.id, name, tickers, notify: list.notify === true });
  }
  return lists;
}

// `local` folded into `server` when a browser's lists first meet an account: lists in both (same id) keep every
// company from either and notify if either had it on; lists only in this browser are added after the saved ones.
export function mergeLists(server, local) {
  const byId = new Map(server.map((list) => [list.id, list]));
  const merged = server.map((list) => {
    const mine = local.find((l) => l.id === list.id);
    if (!mine) return list;
    return { ...list, tickers: [...new Set([...list.tickers, ...mine.tickers])], notify: list.notify || mine.notify };
  });
  return cleanLists([...merged, ...local.filter((list) => !byId.has(list.id))]);
}
