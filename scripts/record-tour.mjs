// Records a ~1 minute 1600 × 900 tour of the app with captions and a visible cursor: docs/video/open-market-tour.webm
//   node scripts/record-tour.mjs                         # against http://localhost:3000
//   TOUR_URL=https://www.getopenmarket.app node scripts/record-tour.mjs
// Use a production build or the live site, so the Next.js dev badge isn't in the video.
// Posting a suggestion and voting are answered in the browser: recording never writes real data.
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.TOUR_URL || "http://localhost:3000";
const OUT = "docs/video/open-market-tour.webm";
const SIZE = { width: 1600, height: 900 };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A fake cursor (recordings don't show the real one) and a caption bar, added to every page
const OVERLAY = () => {
  const install = () => {
    if (document.getElementById("tour-cursor")) return;
    const style = document.createElement("style");
    style.textContent = `
      #tour-cursor { position: fixed; z-index: 2147483647; left: 0; top: 0; width: 22px; height: 22px; margin: -11px 0 0 -11px;
        border-radius: 50%; background: rgba(26, 91, 196, 0.35); border: 2px solid #1a5bc4; pointer-events: none;
        transition: transform 120ms ease; }
      body:has(#tour-card.on) #tour-cursor { opacity: 0; }
      #tour-cursor.down { transform: scale(0.7); background: rgba(26, 91, 196, 0.6); }
      #tour-caption { position: fixed; z-index: 2147483646; left: 50%; bottom: 28px; transform: translateX(-50%);
        max-width: 1000px; padding: 14px 22px; background: #101014; color: #fff; pointer-events: none;
        font: 600 22px/1.3 var(--font-inter), system-ui, sans-serif; letter-spacing: -0.01em; text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,.25); opacity: 0; transition: opacity 250ms ease; }
      #tour-caption.on { opacity: 1; }
      #tour-caption b { color: #7fa8ee; font-weight: 700; }
      #tour-card { position: fixed; z-index: 2147483645; inset: 0; display: flex; flex-direction: column; align-items: flex-start;
        justify-content: center; padding: 0 96px; background: #f2f1ee; color: #000; pointer-events: none;
        opacity: 0; transition: opacity 400ms ease; }
      #tour-card.on { opacity: 1; }
      #tour-card .eyebrow { font: 500 18px var(--font-geist-mono), monospace; letter-spacing: .16em; text-transform: uppercase; color: rgba(16,16,20,.55); }
      #tour-card .title { margin: 18px 0 0; font: 700 76px/1.02 var(--font-bricolage), sans-serif; letter-spacing: -0.04em; }
      #tour-card .title span { color: #1a5bc4; }
      #tour-card p { margin: 22px 0 0; max-width: 900px; font: 400 24px/1.45 var(--font-geist-mono), monospace; color: rgba(16,16,20,.72); }
    `;
    document.head.append(style);
    const cursor = Object.assign(document.createElement("div"), { id: "tour-cursor" });
    const caption = Object.assign(document.createElement("div"), { id: "tour-caption" });
    const card = Object.assign(document.createElement("div"), { id: "tour-card" });
    document.body.append(cursor, caption, card);
    const at = window.__tourCursor ?? { x: 640, y: 360 };
    cursor.style.left = `${at.x}px`;
    cursor.style.top = `${at.y}px`;
    addEventListener("mousemove", (e) => {
      window.__tourCursor = { x: e.clientX, y: e.clientY };
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    }, true);
    addEventListener("mousedown", () => cursor.classList.add("down"), true);
    addEventListener("mouseup", () => cursor.classList.remove("down"), true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
};

async function caption(page, html) {
  await page.evaluate((text) => {
    const el = document.getElementById("tour-caption");
    if (!text) return el.classList.remove("on");
    el.innerHTML = text;
    el.classList.add("on");
  }, html);
}

async function card(page, html) {
  await page.evaluate((content) => {
    const el = document.getElementById("tour-card");
    if (!content) return el.classList.remove("on");
    el.innerHTML = content;
    el.classList.add("on");
  }, html);
}

// Glide the cursor to the middle of `locator`, then optionally click it
async function point(page, locator, { click = false, steps = 30 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  if (click) {
    await wait(200);
    await page.mouse.down();
    await wait(90);
    await page.mouse.up();
  }
}

async function type(locator, text) {
  await locator.click();
  await locator.pressSequentially(text, { delay: 85 });
}

async function open(page, path) {
  await page.goto(new URL(path, BASE_URL).href);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

// The real board is shown; posts and votes are answered here instead of reaching the server
async function fakeWrites(page) {
  let board = [];
  await page.route("**/api/suggestions", async (route) => {
    if (route.request().method() === "GET") {
      const response = await route.fetch();
      board = (await response.json()).suggestions ?? [];
      return route.fulfill({ response, json: { suggestions: board } });
    }
    const suggestion = {
      id: "f".repeat(24),
      title: "Options Expiration Calendar",
      description: "See monthly and weekly options expirations next to earnings dates.",
      icon: "calendar",
      score: 1,
      requests: 1,
      myVote: 1,
      createdAt: new Date().toISOString(),
    };
    return route.fulfill({ json: { suggestion, merged: false } });
  });
  await page.route("**/api/suggestions/*/vote", async (route) => {
    const id = route.request().url().split("/").at(-2);
    const { value } = route.request().postDataJSON();
    const current = board.find((s) => s.id === id);
    return route.fulfill({ json: { suggestion: { ...current, myVote: value, score: current.score - current.myVote + value } } });
  });
}

const tiles = (page) => page.locator("[data-tiles] button[aria-label*=' · ']");

async function tour(page) {
  // 1 · Title card over the calendar
  await open(page, "/");
  await card(
    page,
    `<div class="eyebrow">Open Market</div><div class="title">Every free market tool,<br><span>in one place</span>.</div>
     <p>Earnings, sentiment, Fed odds and macro releases. Free, open source, no account.</p>`
  );
  await wait(3800);
  await card(page, "");
  await wait(600);

  // 2 · Market context (collapsed to one row by default: open it)
  await point(page, page.getByRole("button", { name: /^Expand market sentiment/ }), { click: true });
  await wait(600);
  await caption(page, "Start with the <b>mood of the market</b>: CNN's Fear &amp; Greed Index");
  await point(page, page.getByText("Market sentiment"));
  await wait(2200);
  await caption(page, "…and the next <b>Fed, GDP, jobs and CPI</b> releases, with Kalshi's expectations");
  const release = page.getByText(/FOMC decision|CPI inflation|Jobs report|GDP growth/).first();
  await point(page, (await release.count()) ? release : page.getByText("Key releases"), { steps: 40 });
  await wait(2800);

  // 3 · Calendar
  await caption(page, "Every company reporting this month, marked by <b>when it reports</b> and whether it <b>beat or missed</b>");
  const all = await tiles(page).all();
  for (const tile of all.slice(0, 6)) {
    await point(page, tile, { steps: 12 });
    await wait(250);
  }
  await wait(1200);

  // 4 · Company details
  const reported = page.locator("[data-tiles] button[aria-label$=' · Beat']").first();
  const pick = (await reported.count()) ? reported : tiles(page).first();
  await caption(page, "Open any company: <b>EPS and revenue vs estimates</b>, surprise history and SEC filings");
  await point(page, pick, { click: true });
  await page.getByRole("dialog").waitFor();
  await wait(2600);
  const chart = page.getByRole("dialog").getByText(/surprise/i).first();
  if (await chart.count()) await point(page, chart, { steps: 25 });
  await wait(2000);
  await point(page, page.getByRole("button", { name: "Close details" }), { click: true });
  await wait(700);

  // 5 · Search
  const ticker = (await pick.getAttribute("aria-label")).split(" · ")[0];
  await caption(page, "<b>Search</b> any ticker or company: matches light up on the calendar");
  const search = page.getByRole("searchbox", { name: "Search ticker or company" });
  await point(page, search);
  await type(search, ticker);
  await wait(2600);
  await point(page, page.getByRole("heading", { level: 1 }), { click: true });
  await caption(page, "");
  await wait(600);

  // 6 · Views
  await caption(page, "See a <b>day, a week or the whole month</b>");
  for (const name of ["Week view", "Day view", "Month view"]) {
    await point(page, page.getByRole("link", { name }), { click: true });
    await page.waitForLoadState("networkidle");
    await wait(1700);
  }

  // 7 · Watchlists
  const [first, second] = await Promise.all(all.slice(0, 2).map(async (t) => (await t.getAttribute("aria-label")).split(" · ")[0]));
  await caption(page, "Follow just your companies with <b>your own watchlists</b>");
  await point(page, page.getByRole("button", { name: "Create watchlist" }), { click: true });
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Watchlist name").waitFor();
  await type(dialog.getByLabel("Watchlist name"), "My picks");
  for (const t of [first, second]) {
    const box = dialog.getByLabel("Add companies");
    await type(box, t);
    const row = dialog.getByRole("button").filter({ has: page.getByText(t, { exact: true }) }).first();
    await row.waitFor();
    await wait(500);
    await point(page, row, { click: true, steps: 15 });
    await wait(500);
  }
  await point(page, dialog.getByRole("button", { name: "Create watchlist" }), { click: true });
  await page.waitForLoadState("networkidle");
  await wait(2800);
  await caption(page, "");

  // 8 · Roadmap and voting
  await open(page, "/roadmap");
  await caption(page, "The community decides what's next: <b>vote on the ideas you want built</b>");
  const up = page.getByRole("button", { name: /^Upvote / }).first();
  if (await up.count()) {
    await point(page, up, { click: true });
    await wait(2400);
  } else {
    await wait(2400);
  }

  // 9 · Suggest a feature
  await caption(page, "Missing something? <b>Suggest it</b>: AI turns it into a card and merges duplicates");
  // The button beside the board's heading (the first one is in the header menu)
  await point(page, page.locator("main").getByRole("button", { name: "Suggest a feature" }).first(), { click: true });
  const suggest = page.getByRole("dialog");
  await type(suggest.getByLabel("Your suggestion"), "Show options expiration dates on the calendar");
  await wait(400);
  await point(page, suggest.getByRole("button", { name: "Post" }), { click: true });
  await suggest.getByRole("status").waitFor();
  await wait(3200);
  await caption(page, "");

  // 10 · End card
  await card(
    page,
    `<div class="eyebrow">Free · Open source · Built by its users</div><div class="title">Open <span>Market</span>.</div>
     <p>getopenmarket.app<br>github.com/FullPokerFace/open-market</p>`
  );
  await wait(4000);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  colorScheme: "light",
  recordVideo: { dir: dirname(OUT), size: SIZE },
});
await context.addInitScript(OVERLAY);
const page = await context.newPage();
await fakeWrites(page);

try {
  await tour(page);
} finally {
  await context.close();
  await browser.close();
}

// Playwright names the file after the page; give it a stable name
await mkdir(dirname(OUT), { recursive: true });
const recorded = await page.video().path();
await rm(OUT, { force: true });
await rename(recorded, join(OUT));
console.log(`Saved ${OUT}`);
