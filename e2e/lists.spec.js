import { expect, test } from "@playwright/test";
import { open, tickerOf, tiles } from "./helpers";

// Lists live in the browser (localStorage + a cookie), and each test gets a fresh browser context,
// so nothing here touches shared data
test("creates a watchlist and shows only its companies", async ({ page }) => {
  await open(page, "/");
  const ticker = await tickerOf(tiles(page).first());

  await page.getByRole("button", { name: "Create watchlist" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("New watchlist.")).toBeVisible();

  const create = dialog.getByRole("button", { name: "Create watchlist" });
  await expect(create).toBeDisabled();

  await dialog.getByLabel("Watchlist name").fill("E2E picks");
  await dialog.getByLabel("Add companies").fill(ticker);
  await dialog.getByRole("button").filter({ has: page.getByText(ticker, { exact: true }) }).first().click();
  await expect(dialog.getByRole("button", { name: `Remove ${ticker}` })).toBeVisible();

  await create.click();
  await expect(dialog).toBeHidden();

  const select = page.getByLabel("Exchange or watchlist");
  await expect(select.locator("option:checked")).toHaveText("E2E picks");
  // Only the watchlist's company is left on the calendar
  await expect(tiles(page).first()).toHaveAttribute("aria-label", new RegExp(`^${ticker} · `));
  const others = await tiles(page).evaluateAll(
    (els, t) => els.filter((el) => !el.getAttribute("aria-label").startsWith(`${t} · `)).length,
    ticker
  );
  expect(others).toBe(0);
});

test("manages watchlists on their page", async ({ page }) => {
  await open(page, "/");
  const ticker = await tickerOf(tiles(page).first());

  await page.getByRole("link", { name: "Watchlists" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your watchlists.");
  await expect(page.getByText("No watchlists yet.", { exact: false })).toBeVisible();

  // New
  await page.getByRole("button", { name: "New watchlist" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Watchlist name").fill("E2E page");
  await dialog.getByLabel("Add companies").fill(ticker);
  await dialog.getByRole("button").filter({ has: page.getByText(ticker, { exact: true }) }).first().click();
  await dialog.getByRole("button", { name: "Create watchlist" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: /E2E page/ })).toBeVisible();

  // Edit: rename it
  await page.getByRole("button", { name: "Edit E2E page" }).click();
  await expect(dialog.getByLabel("Watchlist name")).toHaveValue("E2E page");
  await dialog.getByLabel("Watchlist name").fill("E2E renamed");
  await dialog.getByRole("button", { name: "Save watchlist" }).click();
  await expect(page.getByRole("heading", { name: /E2E renamed/ })).toBeVisible();

  // Delete
  page.once("dialog", (confirm) => confirm.accept());
  await page.getByRole("button", { name: "Delete E2E renamed" }).click();
  await expect(page.getByText("No watchlists yet.", { exact: false })).toBeVisible();
});
