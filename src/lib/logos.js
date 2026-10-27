// Server-only: company logos from logo.dev, saved in MongoDB as { data, fetchedAt } and fetched again once 30 days old.
// Tickers logo.dev has no logo for are saved too (data: { missing: true }), so they aren't asked about every visit.
// Visitors never wait on logo.dev here: logos not saved yet are sent straight from logo.dev (see logoDevUrl)
// while saveLogo fills the collection in the background.
import { Binary } from "mongodb";
import { COLLECTIONS, DAY, getDb } from "@/lib/db";

const MAX_AGE = 30 * DAY;

// logo.dev answers 429 when asked too fast, and an empty collection queues a whole month of tiles at once.
// So background saves go out one at a time, GAP_MS apart, and a 429 pauses them all before trying again.
const GAP_MS = 150;
const RETRIES = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let queue = Promise.resolve();

// Resolves when it's this request's turn
function nextTurn() {
  return (queue = queue.then(() => sleep(GAP_MS)));
}

function pauseQueue(ms) {
  queue = queue.then(() => sleep(ms));
}

async function logos() {
  return (await getDb()).collection(COLLECTIONS.companyLogos);
}

// The logo image on logo.dev's CDN. Its token is a publishable key, made to be seen by browsers.
export function logoDevUrl(symbol) {
  const token = process.env.LOGO_DEV_TOKEN;
  if (!token) throw new Error("LOGO_DEV_TOKEN is not set in .env.local");
  const params = new URLSearchParams({ token, size: "64", format: "png", retina: "true", fallback: "404" });
  return `https://img.logo.dev/ticker/${encodeURIComponent(symbol)}?${params}`;
}

// The saved logo: { logo: { type, bytes } | null (logo.dev has none), fresh }, or null when it isn't saved yet.
// `fresh` is false once it's 30 days old; it's still served while saveLogo replaces it.
export async function findLogo(symbol) {
  const saved = await (await logos()).findOne({ _id: symbol });
  if (!saved) return null;
  const fresh = Date.now() - saved.fetchedAt.getTime() < MAX_AGE;
  const { data } = saved;
  return { logo: data.missing ? null : { type: data.type, bytes: data.image.value() }, fresh };
}

async function fetchLogo(symbol) {
  let res;
  for (let attempt = 0; ; attempt++) {
    await nextTurn();
    const started = performance.now();
    res = await fetch(logoDevUrl(symbol));
    // One line per real request; the token is in the query, so the logged URL leaves it out
    console.log(`[logo.dev] GET /ticker/${symbol} → ${res.status} in ${Math.round(performance.now() - started)}ms`);
    if (res.status !== 429 || attempt === RETRIES) break;
    // Retry-After in seconds when logo.dev sends it, else 1s, 2s, 4s
    pauseQueue(Number(res.headers.get("retry-after")) * 1000 || 1000 * 2 ** attempt);
  }
  if (res.status === 404) return { missing: true };
  if (!res.ok) throw new Error(`logo.dev /ticker/${symbol} responded ${res.status}`);
  return {
    type: res.headers.get("content-type") ?? "image/png",
    image: new Binary(new Uint8Array(await res.arrayBuffer())),
  };
}

// Saves in progress, by symbol, so a logo many visitors ask for at once is fetched once
const saving = new Map();

// Fetches the symbol's logo from logo.dev and saves it. Runs after the response, so failures are only logged:
// the old copy (if any) stays, and the next visit queues it again.
export function saveLogo(symbol) {
  if (!saving.has(symbol)) {
    const save = (async () => {
      try {
        const data = await fetchLogo(symbol);
        await (await logos()).replaceOne({ _id: symbol }, { data, fetchedAt: new Date() }, { upsert: true });
        console.log(`[db] companyLogos/${symbol} fetched from logo.dev and saved`);
      } catch (error) {
        console.error(`[db] saving companyLogos/${symbol} failed`, error);
      }
    })().finally(() => saving.delete(symbol));
    saving.set(symbol, save);
  }
  return saving.get(symbol);
}
