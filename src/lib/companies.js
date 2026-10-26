// Server-only: exchange-listed US companies, one MongoDB document per symbol:
// { _id: SYMBOL, exchange, name, cik, listedAt }, refreshed together once a day.
// Finnhub says which exchange each symbol trades on; the SEC adds its name and CIK.
import { COLLECTIONS, DAY, formatAge, getDb } from "@/lib/db";
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

// { SYMBOL: { exchange, name, cik } } for the listed ones among `symbols`. Symbols missing from it aren't
// exchange-listed (OTC, closed-end funds); name and cik are null for the few the SEC list doesn't have.
export async function getCompanyDirectory(symbols) {
  const companies = await getCompanies();
  const started = performance.now();
  const listedAt = await freshListing(companies);
  const found = await companies
    .find({ _id: { $in: [...new Set(symbols)] }, listedAt: { $exists: true } }, { projection: { exchange: 1, name: 1, cik: 1 } })
    .toArray();
  console.log(
    `[db] companies: ${found.length} listed of ${new Set(symbols).size} symbols (listing saved ${formatAge(Date.now() - listedAt.getTime())} ago) in ${Math.round(performance.now() - started)}ms`
  );
  return Object.fromEntries(found.map(({ _id, exchange, name, cik }) => [_id, { exchange, name, cik }]));
}

