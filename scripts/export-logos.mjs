// One-off move off MongoDB: copies every company logo saved in companyLogos into public/logos, served as
// /logos/logo-AAPL.png, and lists the tickers logo.dev had no logo for in src/lib/logo-missing.json.
//   npm run logos:export
// Safe to run again: files are overwritten with the saved copies, and nothing in MongoDB changes.
// Afterwards `npm run logos:sync` keeps the folder up to date, and the companyLogos collection can be dropped.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { COLLECTIONS, getDb } from "../src/lib/db.js";
import { logoFileName } from "../src/lib/logos.js";

const OUT = "public/logos";
const MISSING = "src/lib/logo-missing.json";

// Same .env.local the app reads, for the MongoDB user
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: use the environment as it is
}

await mkdir(OUT, { recursive: true });
const logos = (await getDb()).collection(COLLECTIONS.companyLogos);

let written = 0;
const missing = [];
// Anything that isn't a PNG: logos are fetched as PNG, so these would need a look
const skipped = [];
for await (const { _id: symbol, data } of logos.find({}, { projection: { data: 1 } })) {
  if (data.missing) missing.push(symbol);
  else if (data.type !== "image/png") skipped.push(`${symbol} (${data.type})`);
  else {
    await writeFile(join(OUT, logoFileName(symbol)), data.image.value());
    written++;
  }
}
await writeFile(MISSING, `${JSON.stringify(missing.sort(), null, 2)}\n`);

console.log(`[logos] ${written} logos written to ${OUT}, ${missing.length} without a logo listed in ${MISSING}`);
if (skipped.length) console.warn(`[logos] skipped, not PNG: ${skipped.join(", ")}`);

// getDb keeps its client on globalThis; close it so the script exits
await (await globalThis.mongoClient).close();
