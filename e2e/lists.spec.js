import { expect, test } from "@playwright/test";
import { open, tickerOf, tiles } from "./helpers";

// Lists live in the browser (localStorage + a cookie), and each test gets a fresh browser context,
// so nothing here touches shared data
test("creates a ticker list and shows only its companies", async ({ page }) => {
  await open(page, "/");
  const ticker = await tickerOf(tiles(page).first());

  await page.getByRole("button", { name: "Create list" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("New ticker list.")).toBeVisible();

  const create = dialog.getByRole("button", { name: "Create list" });
  await expect(create).toBeDisabled();

  await dialog.getByLabel("List name").fill("E2E picks");
  await dialog.getByLabel("Add companies").fill(ticker);
  await dialog.getByRole("button").filter({ has: page.getByText(ticker, { exact: true }) }).first().click();
  await expect(dialog.getByRole("button", { name: `Remove ${ticker}` })).toBeVisible();

  await create.click();
  await expect(dialog).toBeHidden();

  const select = page.getByLabel("Exchange or list");
  await expect(select.locator("option:checked")).toHaveText("E2E picks");
  // Only the list's company is left on the calendar
  await expect(tiles(page).first()).toHaveAttribute("aria-label", new RegExp(`^${ticker} · `));
  const others = await tiles(page).evaluateAll(
    (els, t) => els.filter((el) => !el.getAttribute("aria-label").startsWith(`${t} · `)).length,
    ticker
  );
  expect(others).toBe(0);
});
