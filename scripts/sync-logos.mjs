// Adds logos for companies on the calendar (a month back to three months ahead) that public/logos doesn't have yet,
// fetched from logo.dev; tickers it has no logo for go in src/lib/logo-missing.json, so they aren't asked about again.
//   npm run logos:sync        # then commit public/logos and src/lib/logo-missing.json
// Reads the earnings weeks and company listing the app already saved in MongoDB: no Finnhub calls.
// Safe to stop and run again: it only fetches what's still missing.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { COLLECTIONS, DAY, getDb } from "../src/lib/db.js";
import { logoDevUrl, logoFileName } from "../src/lib/logos.js";

const OUT = "public/logos";
const MISSING = "src/lib/logo-missing.json";
const SYMBOL = /^[A-Z0-9.-]{1,12}$/;
// logo.dev answers 429 when asked too fast: one request every GAP_MS, and a 429 waits and tries again
const GAP_MS = 150;
const RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isoFromNow = (days) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

// Same .env.local the app reads, for MongoDB and LOGO_DEV_TOKEN
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: use the environment as it is
}

async function fetchLogo(symbol) {
  for (let attempt = 0; ; attempt++) {
    await sleep(GAP_MS);
    const res = await fetch(logoDevUrl(symbol));
    if (res.status !== 429 || attempt === RETRIES) return res;
    // Retry-After in seconds when logo.dev sends it, else 1s, 2s, 4s
    await sleep(Number(res.headers.get("retry-after")) * 1000 || 1000 * 2 ** attempt);
  }
}

const missing = new Set(JSON.parse(await readFile(MISSING, "utf8")));
const saveMissing = () => writeFile(MISSING, `${JSON.stringify([...missing].sort(), null, 2)}\n`);

// Saved weeks are keyed by their Monday; the one before the range start still holds its first days
const db = await getDb();
const weeks = await db
  .collection(COLLECTIONS.earningsCalendar)
  .find({ _id: { $gte: isoFromNow(-37), $lte: isoFromNow(92) } }, { projection: { data: 1 } })
  .toArray();
const symbols = [...new Set(weeks.flatMap((week) => week.data.map((row) => row.symbol)))];
// Only exchange-listed companies show on the calendar (OTC and closed-end funds don't)
const listed = await db
  .collection(COLLECTIONS.companies)
  .find({ _id: { $in: symbols }, listedAt: { $exists: true } }, { projection: { _id: 1 } })
  .toArray();
// getDb keeps its client on globalThis; close it now that the database part is done
await (await globalThis.mongoClient).close();

const todo = listed
  .map((doc) => doc._id)
  .filter((symbol) => SYMBOL.test(symbol) && !missing.has(symbol) && !existsSync(join(OUT, logoFileName(symbol))))
  .sort();
console.log(`[logos] ${listed.length} listed companies on the calendar, ${todo.length} without a logo file yet`);

await mkdir(OUT, { recursive: true });
let written = 0;
const failed = [];
for (const [i, symbol] of todo.entries()) {
  const res = await fetchLogo(symbol);
  if (res.status === 404) missing.add(symbol);
  else if (!res.ok || !res.headers.get("content-type")?.startsWith("image/png")) {
    failed.push(`${symbol} (${res.status} ${res.headers.get("content-type")})`);
  } else {
    await writeFile(join(OUT, logoFileName(symbol)), Buffer.from(await res.arrayBuffer()));
    written++;
  }
  // Progress, and the missing list saved as it goes, so stopping midway loses nothing
  if ((i + 1) % 50 === 0) {
    await saveMissing();
    console.log(`[logos] ${i + 1} / ${todo.length}`);
  }
}
await saveMissing();

console.log(`[logos] ${written} logos written to ${OUT}, ${missing.size} tickers listed without a logo in ${MISSING}`);
if (failed.length) console.warn(`[logos] failed, run again later: ${failed.join(", ")}`);
