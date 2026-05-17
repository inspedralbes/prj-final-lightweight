import { test, expect } from "@playwright/test";

test("home loads and shows branding", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/LightWeight/i);
});
