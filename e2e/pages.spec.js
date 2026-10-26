import { expect, test } from "@playwright/test";
import { mockSuggestions, open } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockSuggestions(page);
});

test("header links go to each page", async ({ page }) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Primary" });

  await nav.getByRole("link", { name: "Roadmap" }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("roadmap.");
  await expect(nav.getByRole("link", { name: "Roadmap" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("About");

  await nav.getByRole("link", { name: "Calendar" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("roadmap shows the board first, then shipped and coming", async ({ page }) => {
  await open(page, "/roadmap");
  const bars = page.locator("main section .eyebrow").filter({ hasText: /^0\d \// });
  await expect(bars.nth(0)).toContainText("01 / Requested");
  await expect(bars.nth(1)).toContainText("02 / Shipped");
  await expect(bars.nth(2)).toContainText("03 / Coming");
  await expect(page.getByText(/^\d+%$/)).toBeVisible();
});

test("about page links to GitHub and the roadmap", async ({ page }) => {
  await open(page, "/about");
  await expect(page.getByRole("link", { name: /View on GitHub/ })).toHaveAttribute("href", /github\.com/);
  await page.getByRole("link", { name: "See the roadmap" }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
});

test("theme toggle switches light and dark", async ({ page }) => {
  await open(page, "/about");
  const html = page.locator("html");
  const wasDark = (await html.getAttribute("class"))?.includes("dark");

  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  if (wasDark) await expect(html).not.toHaveClass(/\bdark\b/);
  else await expect(html).toHaveClass(/\bdark\b/);
});
