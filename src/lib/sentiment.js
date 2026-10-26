// Server-only: CNN's Fear & Greed Index (0–100), read from the JSON behind its public page.
// Not an official API: CNN turns away requests that don't look like a browser.
import { COLLECTIONS, LATEST, MINUTE, stored } from "@/lib/db";

const URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.cnn.com/",
  Origin: "https://www.cnn.com",
};

// { score, rating, previousClose }, e.g. { score: 28, rating: "fear", previousClose: 21 }
export function getFearGreed() {
  return stored(COLLECTIONS.fearGreed, LATEST, 5 * MINUTE, async () => {
    const res = await fetch(URL, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`CNN Fear & Greed responded ${res.status}`);

    const { fear_and_greed: index } = await res.json();
    if (typeof index?.score !== "number") throw new Error("CNN Fear & Greed returned no score");
    return {
      score: Math.round(index.score),
      rating: index.rating,
      previousClose: Math.round(index.previous_close),
    };
  });
}
