import { expect, test } from "@playwright/test";

test("renders the LMS page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LMS Platform" })).toBeVisible();
});
