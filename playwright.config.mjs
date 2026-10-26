// End-to-end tests (Playwright). Runs against http://localhost:3000 by default, starting `npm run dev`
// if nothing is running there yet. The `test:e2e:live` scripts run them against E2E_LIVE_URL from .env.local
// instead; E2E_BASE_URL, when set, picks any other site. Tests never write real data: suggestion posts
// and votes are answered by mocks in the browser.
import { defineConfig, devices } from "@playwright/test";

// Playwright doesn't read .env files itself; values already in the environment win
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. CI): use the environment as it is
}

// The npm script being run, e.g. "test:e2e:live:ui"
const live = process.env.npm_lifecycle_event?.startsWith("test:e2e:live");
if (live && !process.env.E2E_LIVE_URL) throw new Error("Set E2E_LIVE_URL in .env.local to run the live tests");
const baseURL = process.env.E2E_BASE_URL || (live ? process.env.E2E_LIVE_URL : "http://localhost:3000");
const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(baseURL);

export default defineConfig({
  testDir: "./e2e",
  // Live data (Finnhub, MongoDB) and dev-mode compiles can be slow on a first visit
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
  webServer: local
    ? { command: "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 }
    : undefined,
});
