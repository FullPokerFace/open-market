import { expect, test } from "@playwright/test";
import { card, mockSuggestions, open } from "./helpers";

// The suggestion API is mocked in the browser (see helpers.js): no OpenAI calls, no MongoDB writes, no emails

const openDialog = async (page) => {
  await page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: "Suggest a feature" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Suggest a feature.")).toBeVisible();
  return dialog;
};

test.describe("suggest a feature", () => {
  test("posts a new idea and shows it on the board", async ({ page }) => {
    const { seen } = await mockSuggestions(page);
    await open(page, "/about");
    const dialog = await openDialog(page);

    await expect(dialog.getByText("Company Logos", { exact: true })).toBeVisible();
    const post = dialog.getByRole("button", { name: "Post" });
    await expect(post).toBeDisabled();

    await dialog.getByLabel("Your suggestion").fill("Charts that follow dark mode");
    await post.click();

    await expect(dialog.getByRole("status")).toContainText("Posted.");
    await expect(dialog.getByRole("status")).toContainText("Dark Mode Charts");
    await expect(dialog.getByText("Yours · 1 request")).toBeVisible();
    expect(seen.posts).toEqual([{ message: "Charts that follow dark mode" }]);

    await dialog.getByRole("button", { name: "Suggest another" }).click();
    await expect(dialog.getByLabel("Your suggestion")).toHaveValue("");
  });

  test("tells the visitor when the idea was already on the board", async ({ page }) => {
    await mockSuggestions(page, {
      onPost: () => ({ json: { suggestion: card("a".repeat(24), "Company Logos", 6, { myVote: 1, requests: 2 }), merged: true } }),
    });
    await open(page, "/about");
    const dialog = await openDialog(page);

    await dialog.getByLabel("Your suggestion").fill("logos please");
    await dialog.getByRole("button", { name: "Post" }).click();
    await expect(dialog.getByRole("status")).toContainText("Already on the board.");
    await expect(dialog.getByText("Yours · 2 requests")).toBeVisible();
  });

  test("shows the server's error and keeps the draft", async ({ page }) => {
    await mockSuggestions(page, {
      onPost: () => ({ status: 429, json: { error: "Thanks! That's a lot of ideas. Try again in an hour." } }),
    });
    await open(page, "/about");
    const dialog = await openDialog(page);

    await dialog.getByLabel("Your suggestion").fill("one more idea");
    await dialog.getByRole("button", { name: "Post" }).click();
    await expect(dialog.getByRole("alert")).toContainText("Try again in an hour");
    await expect(dialog.getByLabel("Your suggestion")).toHaveValue("one more idea");
  });
});

test.describe("roadmap board", () => {
  test("lists ideas by votes and lets the visitor vote once", async ({ page }) => {
    const { seen } = await mockSuggestions(page);
    await open(page, "/roadmap");

    await expect(page.getByRole("heading", { name: "User-suggested features." })).toBeVisible();
    await expect(page.getByText("2 ideas · by votes")).toBeVisible();

    const up = page.getByRole("button", { name: "Upvote Company Logos" });
    const down = page.getByRole("button", { name: "Downvote Company Logos" });
    const score = page.locator("[aria-label^='Score ']").first();
    await expect(score).toHaveText("5");

    await up.click();
    await expect(up).toHaveAttribute("aria-pressed", "true");
    await expect(score).toHaveText("6");

    // Switching to down moves the vote, it doesn't add a second one
    await down.click();
    await expect(down).toHaveAttribute("aria-pressed", "true");
    await expect(up).toHaveAttribute("aria-pressed", "false");
    await expect(score).toHaveText("4");

    // Clicking the same vote again takes it back
    await down.click();
    await expect(down).toHaveAttribute("aria-pressed", "false");
    await expect(score).toHaveText("5");

    expect(seen.votes.map((v) => v.value)).toEqual([1, -1, 0]);
  });

  test("says so when there are no ideas yet", async ({ page }) => {
    await mockSuggestions(page, { board: [] });
    await open(page, "/roadmap");
    await expect(page.getByText("No suggestions yet. Be the first.")).toBeVisible();
  });
});

// Read-only checks against the real API: safe on production too
test.describe("suggestions API", () => {
  test("lists the board", async ({ request }) => {
    const res = await request.get("/api/suggestions");
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray((await res.json()).suggestions)).toBe(true);
  });

  test("refuses posts and votes from other sites", async ({ request }) => {
    const headers = { Origin: "https://example.com" };
    expect((await request.post("/api/suggestions", { headers, data: { message: "hello there" } })).status()).toBe(403);
    expect((await request.post(`/api/suggestions/${"a".repeat(24)}/vote`, { headers, data: { value: 1 } })).status()).toBe(403);
  });

  test("rejects invalid votes", async ({ request, baseURL }) => {
    const headers = { Origin: new URL(baseURL).origin };
    expect((await request.post("/api/suggestions/not-an-id/vote", { headers, data: { value: 1 } })).status()).toBe(400);
    expect((await request.post(`/api/suggestions/${"a".repeat(24)}/vote`, { headers, data: { value: 5 } })).status()).toBe(400);
  });
});
