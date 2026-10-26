import { expect } from "@playwright/test";

// Opens `path` and waits until the page has hydrated and its first data requests are done,
// so clicks reach React instead of the server-rendered HTML
export async function open(page, path = "/") {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

// Ticker tiles on the calendar; each one's accessible name is "TICKER · Company · Status"
export const tiles = (page) => page.locator("[data-tiles] button[aria-label*=' · ']");

export async function tickerOf(tile) {
  return (await tile.getAttribute("aria-label")).split(" · ")[0];
}

// A tile that the search `query` doesn't match (ticker prefix or name), to check dimming against
export async function tileNotMatching(page, query) {
  const q = query.toUpperCase();
  for (const tile of await tiles(page).all()) {
    const [ticker, name] = (await tile.getAttribute("aria-label")).split(" · ");
    if (!ticker.startsWith(q) && !name.toUpperCase().includes(q)) return tile;
  }
  throw new Error(`Every tile matches "${query}"`);
}

export const expectDimmed = (tile) => expect(tile).toHaveCSS("opacity", "0.18");
export const expectNotDimmed = (tile) => expect(tile).toHaveCSS("opacity", "1");

const card = (id, title, score, extra = {}) => ({
  id,
  title,
  description: `${title} for everyone.`,
  icon: "idea",
  score,
  requests: 1,
  myVote: 0,
  createdAt: "2026-10-26T12:00:00.000Z",
  ...extra,
});

// Answers the suggestion API in the browser so tests never call OpenAI or write to MongoDB.
// Returns the requests it saw, to assert on what the page sent.
export async function mockSuggestions(page, { board, onPost } = {}) {
  const cards = board ?? [card("a".repeat(24), "Company Logos", 5), card("b".repeat(24), "Price Alerts", 2)];
  const seen = { posts: [], votes: [] };

  await page.route("**/api/suggestions", async (route) => {
    const request = route.request();
    if (request.method() === "GET") return route.fulfill({ json: { suggestions: cards } });
    const body = request.postDataJSON();
    seen.posts.push(body);
    const reply = onPost?.(body) ?? {
      json: { suggestion: card("c".repeat(24), "Dark Mode Charts", 1, { myVote: 1 }), merged: false },
    };
    return route.fulfill(reply);
  });

  await page.route("**/api/suggestions/*/vote", async (route) => {
    const id = route.request().url().split("/").at(-2);
    const { value } = route.request().postDataJSON();
    seen.votes.push({ id, value });
    const current = cards.find((c) => c.id === id);
    const suggestion = { ...current, myVote: value, score: current.score - current.myVote + value };
    return route.fulfill({ json: { suggestion } });
  });

  return { seen, cards };
}

export { card };
