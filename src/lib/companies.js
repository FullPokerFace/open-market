// Server-only: exchange-listed US companies, one MongoDB document per symbol:
// { _id: SYMBOL, exchange, name, cik, listedAt }, refreshed together once a day.
// Finnhub says which exchange each symbol trades on; the SEC adds its name and CIK.
import { COLLECTIONS, DAY, formatAge, getDb, MINUTE } from "@/lib/db";
import { fetchListedSymbols } from "@/lib/finnhub";
import { fetchSecCompanies } from "@/lib/sec";

async function getCompanies() {
  return (await getDb()).collection(COLLECTIONS.companies);
}

// Saves today's listing: every listed symbol gets the same `listedAt`, and symbols no longer listed are removed
async function refreshListing(companies) {
  const [listed, sec] = await Promise.all([fetchListedSymbols(), fetchSecCompanies()]);
  const listedAt = new Date();
  const updates = Object.entries(listed).map(([symbol, exchange]) => {
    // SEC writes share classes with a dash (BRK-A), Finnhub with a dot (BRK.A)
    const company = sec[symbol.replace(".", "-")];
    const fields = { exchange, name: company?.title ?? null, cik: company?.cik ?? null, listedAt };
    return { updateOne: { filter: { _id: symbol }, update: { $set: fields }, upsert: true } };
  });
  await companies.bulkWrite(updates, { ordered: false });
  await companies.deleteMany({ listedAt: { $ne: listedAt } });
  await companies.createIndex({ listedAt: -1 });
  return listedAt;
}

// Refresh running right now, so requests that arrive together share it
let refreshing = null;

// When the saved listing is from, refreshing it first if it's a day old.
// When the refresh fails, the older listing is used instead of the error.
async function freshListing(companies) {
  const newest = await companies.findOne({ listedAt: { $exists: true } }, { sort: { listedAt: -1 }, projection: { listedAt: 1 } });
  if (newest && Date.now() - newest.listedAt.getTime() < DAY) return newest.listedAt;

  refreshing ??= refreshListing(companies).finally(() => (refreshing = null));
  try {
    const listedAt = await refreshing;
    console.log(`[db] companies listing ${newest ? `was ${formatAge(Date.now() - newest.listedAt.getTime())} old,` : "not saved yet,"} fetched from source and saved`);
    return listedAt;
  } catch (error) {
    if (!newest) throw error;
    console.error(`[db] refreshing companies failed, using the listing from ${newest.listedAt.toISOString()}`, error);
    return newest.listedAt;
  }
}

// What this process already looked up from one listing, so a page whose companies were all seen before doesn't ask
// MongoDB: { listedAt, checkUntil, bySymbol: Map(SYMBOL → { exchange, name, cik } or null when not listed) }.
// On globalThis so dev reloads keep it.
const FAILED_RETRY = 10 * MINUTE;

// The listing in memory, checked against MongoDB again once it's a day old (or soon after a failed refresh)
async function currentListing(companies) {
  const known = globalThis.companyListing;
  if (known && Date.now() < known.checkUntil) return known;

  const listedAt = await freshListing(companies);
  const dayOld = listedAt.getTime() + DAY;
  // A failed refresh hands back an older listing: try again in a few minutes, not on every request
  const checkUntil = dayOld > Date.now() ? dayOld : Date.now() + FAILED_RETRY;
  const sameListing = known?.listedAt.getTime() === listedAt.getTime();
  globalThis.companyListing = { listedAt, checkUntil, bySymbol: sameListing ? known.bySymbol : new Map() };
  return globalThis.companyListing;
}

// { SYMBOL: { exchange, name, cik } } for the listed ones among `symbols`. Symbols missing from it aren't
// exchange-listed (OTC, closed-end funds); name and cik are null for the few the SEC list doesn't have.
export async function getCompanyDirectory(symbols) {
  const companies = await getCompanies();
  const started = performance.now();
  const listing = await currentListing(companies);
  const wanted = [...new Set(symbols)];
  const unseen = wanted.filter((symbol) => !listing.bySymbol.has(symbol));
  if (unseen.length) {
    const found = await companies
      .find({ _id: { $in: unseen }, listedAt: { $exists: true } }, { projection: { exchange: 1, name: 1, cik: 1 } })
      .toArray();
    for (const symbol of unseen) listing.bySymbol.set(symbol, null);
    for (const { _id, exchange, name, cik } of found) listing.bySymbol.set(_id, { exchange, name, cik });
    console.log(
      `[db] companies: ${found.length} listed of ${unseen.length} new symbols (listing saved ${formatAge(Date.now() - listing.listedAt.getTime())} ago) in ${Math.round(performance.now() - started)}ms`
    );
  }
  const directory = {};
  for (const symbol of wanted) {
    const company = listing.bySymbol.get(symbol);
    if (company) directory[symbol] = company;
  }
  return directory;
}
