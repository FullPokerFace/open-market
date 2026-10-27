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

  test("opens a company's details and adds it to a new watchlist", async ({ page }) => {
    const tile = tiles(page).first();
    const ticker = await tickerOf(tile);
    await tile.click();

    // The create-list dialog opens over the sheet, so pick the sheet out by its close button
    const sheet = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Close details" }) });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(ticker, { exact: true }).first()).toBeVisible();
    await expect(sheet.getByText("EPS", { exact: true }).first()).toBeVisible();

    // A fresh browser has no lists: start one, already holding this company
    await sheet.getByRole("button", { name: "Add to a new watchlist" }).click();
    const create = page.getByRole("dialog", { name: /New watchlist/ });
    await expect(create.getByText(ticker, { exact: true }).first()).toBeVisible();
    await create.getByLabel("Watchlist name").fill("E2E");
    await create.getByRole("button", { name: "Create watchlist" }).click();
    await expect(create).toBeHidden();

    await expect(sheet.getByLabel("Watchlist", { exact: true })).toHaveValue(/.+/);
    const inList = sheet.getByRole("button", { name: "Added" });
    await expect(inList).toHaveAttribute("aria-pressed", "true");
    // Its only company can't be taken out
    await expect(inList).toBeDisabled();

    await sheet.getByRole("button", { name: "Close details" }).click();
    await expect(sheet).toBeHidden();
  });

  test("filters by exchange", async ({ page }) => {
    const select = page.getByLabel("Exchange or watchlist");
    const options = await select.locator("option:not([disabled])").evaluateAll((els) => els.map((el) => el.value));
    test.skip(options.length < 2, "Only one filter available");

    await select.selectOption(options[1]);
    await expect(select).toHaveValue(options[1]);
    await expect(page).toHaveURL(/\?/);
  });
});
