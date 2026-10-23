// Server-only: company names and SEC IDs (CIK) for every US-listed ticker.
import { cacheLife } from "next/cache";

// SEC asks automated clients to identify themselves in the User-Agent header
const USER_AGENT = process.env.SEC_USER_AGENT || "EarningsReport/0.1 (https://iwan-web.com)";

// { TICKER: { title, cik } }
export async function getCompanyDirectory() {
  "use cache";
  cacheLife("days");

  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`SEC company list responded ${res.status}`);

  const directory = {};
  for (const { ticker, title, cik_str } of Object.values(await res.json())) {
    directory[ticker] ??= { title, cik: cik_str };
  }
  return directory;
}
