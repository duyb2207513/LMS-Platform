import { expect, test } from "@playwright/test";

test("renders the LMS page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LMS Platform" })).toBeVisible();
});

test("shows direct GitHub login", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Tiếp tục với GitHub" })).toBeVisible();
});
