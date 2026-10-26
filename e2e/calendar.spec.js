import { expect, test } from "@playwright/test";
import { open, tickerOf, tiles } from "./helpers";

// Live data changes every day, so these tests pick whatever companies are on screen instead of fixed tickers

test.describe("calendar", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/");
  });

  test("shows the month with companies and market context", async ({ page }) => {
    await expect(page).toHaveTitle(/Open Market/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("earnings.");
    await expect(page.getByText("Market sentiment")).toBeVisible();
    await expect(page.getByText("Key releases")).toBeVisible();
    await expect(page.getByRole("link", { name: "Month view" })).toHaveAttribute("aria-current", "page");
    await expect(tiles(page).first()).toBeVisible();
  });

  test("steps to the next month and back", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    const current = await heading.textContent();

    await page.getByRole("link", { name: "Next month" }).click();
    await expect(page).toHaveURL(/month=/);
    await expect(heading).not.toHaveText(current);

    await page.getByRole("link", { name: "Previous month" }).click();
    await expect(heading).toHaveText(current);
  });

  test("switches between day, week and month views", async ({ page }) => {
    for (const name of ["Week view", "Day view", "Month view"]) {
      await page.getByRole("link", { name }).click();
      await expect(page.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
    }
  });

  test("opens a company's details and adds it to the watchlist", async ({ page }) => {
    const tile = tiles(page).first();
    const ticker = await tickerOf(tile);
    await tile.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(ticker, { exact: true }).first()).toBeVisible();
    await expect(sheet.getByText("EPS", { exact: true }).first()).toBeVisible();

    const watch = sheet.getByRole("button", { name: /watchlist/i });
    await expect(watch).toHaveAttribute("aria-pressed", "false");
    await watch.click();
    await expect(watch).toHaveAttribute("aria-pressed", "true");
    await expect(watch).toHaveText(/On your watchlist/i);

    await sheet.getByRole("button", { name: "Close details" }).click();
    await expect(sheet).toBeHidden();
  });

  test("filters by exchange", async ({ page }) => {
    const select = page.getByLabel("Exchange or list");
    const options = await select.locator("option:not([disabled])").evaluateAll((els) => els.map((el) => el.value));
    test.skip(options.length < 2, "Only one filter available");

    await select.selectOption(options[1]);
    await expect(select).toHaveValue(options[1]);
    await expect(page).toHaveURL(/\?/);
  });
});
