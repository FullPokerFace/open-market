import { expect, test } from "@playwright/test";
import { mockSuggestions, open, tiles } from "./helpers";

// Runs in the "mobile" project only (Pixel 7): the header collapses into a burger menu

test("calendar loads on a phone", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("earnings.");
  await expect(page.getByRole("searchbox", { name: "Search ticker or company" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(tiles(page).first()).toBeAttached();
});

test("burger menu navigates and opens Suggest a feature", async ({ page }) => {
  await mockSuggestions(page);
  await open(page, "/");

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Roadmap" }).click();
  await expect(page).toHaveURL(/\/roadmap$/);

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Suggest a feature" }).click();
  // The menu sheet may still be closing, so find the suggestion dialog by its content
  // (the roadmap page behind it has its own board with the same cards)
  const dialog = page.getByRole("dialog").filter({ hasText: "Suggest a feature." });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Company Logos", { exact: true })).toBeVisible();
});
