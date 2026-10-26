// Server-only MongoDB access. Data from outside sources (Finnhub, SEC, CNN, Kalshi)
// is saved here, so a restart or a new server instance starts from what's already stored.
import { MongoClient } from "mongodb";

const HOST = "cluster0.uwl5wy9.mongodb.net";
const DB_NAME = "earnings-report";

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

function connect() {
  const user = process.env.MONGO_DB_USER;
  const password = process.env.MONGO_DB_PASSWORD;
  if (!user || !password) throw new Error("MONGO_DB_USER and MONGO_DB_PASSWORD must be set in .env.local");

  const uri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${HOST}/`;
  return new MongoClient(uri, { appName: "earnings-report" }).connect();
}

// One client per server process; kept on globalThis so dev reloads don't open new connections
export async function getDb() {
  globalThis.mongoClient ??= connect().catch((error) => {
    // Let the next request try again instead of keeping the failed attempt
    globalThis.mongoClient = undefined;
    throw error;
  });
  return (await globalThis.mongoClient).db(DB_NAME);
}

// "42s", "17m", "3h", "2d"
export function formatAge(ms) {
  if (ms < MINUTE) return `${Math.round(ms / 1000)}s`;
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m`;
  if (ms < DAY) return `${Math.round(ms / HOUR)}h`;
  return `${Math.round(ms / DAY)}d`;
}

// Loads running right now, by key, so requests that arrive together share one fetch
const inFlight = new Map();

// One collection per kind of data; data that's one value overall (not per symbol or week) is saved under this id
export const COLLECTIONS = {
  earningsCalendar: "earningsCalendar", // _id: the week's Monday
  epsHistory: "epsHistory", // _id: symbol
  companyProfiles: "companyProfiles", // _id: symbol
  companies: "companies", // _id: symbol; see companies.js
  fearGreed: "fearGreed",
  keyReleases: "keyReleases",
};
// Collections whose every fetch is also added to "<name>History", e.g. fearGreedHistory, to chart over time
const KEEP_HISTORY = new Set([COLLECTIONS.fearGreed, COLLECTIONS.keyReleases]);
export const LATEST = "latest";

// The saved document `id` in `collection` if it's younger than `maxAge` (ms); otherwise runs `load`, saves and
// returns its result. When `load` fails, an older saved copy is returned instead of the error.
export async function stored(collection, id, maxAge, load) {
  const db = await getDb();
  const docs = db.collection(collection);
  const key = `${collection}/${id}`;
  const started = performance.now();
  const saved = await docs.findOne({ _id: id });
  const age = saved && Date.now() - saved.fetchedAt.getTime();
  if (saved && age < maxAge) {
    console.log(`[db] ${key} from database (saved ${formatAge(age)} ago) in ${Math.round(performance.now() - started)}ms`);
    return saved.data;
  }

  if (!inFlight.has(key)) {
    const refresh = (async () => {
      const data = await load();
      const fetchedAt = new Date();
      await Promise.all([
        docs.replaceOne({ _id: id }, { data, fetchedAt }, { upsert: true }),
        KEEP_HISTORY.has(collection) && db.collection(`${collection}History`).insertOne({ data, fetchedAt }),
      ]);
      console.log(
        `[db] ${key} ${saved ? `was ${formatAge(age)} old,` : "not saved yet,"} fetched from source and saved in ${Math.round(performance.now() - started)}ms`
      );
      return data;
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, refresh);
  }

  try {
    return await inFlight.get(key);
  } catch (error) {
    if (!saved) throw error;
    console.error(`[db] refreshing ${key} failed, using the copy from ${saved.fetchedAt.toISOString()}`, error);
    return saved.data;
  }
}
