import { expect, test } from "@playwright/test";
import { expectDimmed, expectNotDimmed, open, tickerOf, tileNotMatching, tiles } from "./helpers";

test.describe("search", () => {
  let ticker;
  let search;

  test.beforeEach(async ({ page }) => {
    await open(page, "/");
    ticker = await tickerOf(tiles(page).first());
    search = page.getByRole("searchbox", { name: "Search ticker or company" });
  });

  test("lists matching companies and opens one", async ({ page }) => {
    await search.fill(ticker);
    const results = page.locator("#search-results");
    await expect(results).toBeVisible();
    await expect(results).toContainText(`“${ticker}”`);

    const row = results.getByRole("button").filter({ has: page.getByText(ticker, { exact: true }) }).first();
    await expect(row).toBeVisible();
    await row.click();

    await expect(results).toBeHidden();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("says when nothing matches", async ({ page }) => {
    await search.fill("ZZZZQQ");
    await expect(page.locator("#search-results")).toContainText("No companies match.");
  });

  test("dims non-matching tiles only while search is open", async ({ page }) => {
    const match = page.locator(`[data-tiles] button[aria-label^="${ticker} · "]`).first();
    const other = await tileNotMatching(page, ticker);

    await search.fill(ticker);
    await expect(page.locator("#search-results")).toBeVisible();
    await expectDimmed(other);
    await expectNotDimmed(match);

    // Clicking outside closes search and shows every company again; the text stays
    await page.getByRole("heading", { level: 1 }).click();
    await expect(page.locator("#search-results")).toBeHidden();
    await expectNotDimmed(other);
    await expect(search).toHaveValue(ticker);

    // Back in the box: results and dimming return
    await search.click();
    await expect(page.locator("#search-results")).toBeVisible();
    await expectDimmed(other);

    // Escape closes it too
    await search.press("Escape");
    await expect(page.locator("#search-results")).toBeHidden();
    await expectNotDimmed(other);
  });

  test("Enter opens the top result", async ({ page }) => {
    await search.fill(ticker);
    await expect(page.locator("#search-results").getByRole("button").first()).toBeVisible();
    await search.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
