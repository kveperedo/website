import { expect, test } from "@playwright/test";

import { gotoAndWaitForHydration } from "../helpers/auth";

test.use({ storageState: { cookies: [], origins: [] } });

test("login page renders correctly", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/login");

  await expect(page).toHaveTitle(/Login/);

  await expect(page.getByLabel(/password/i)).toBeVisible();

  await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
});

test("login with invalid password shows error", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/login");

  await page.getByLabel(/password/i).fill("wrong-password");
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/invalid password/i)).toBeVisible({ timeout: 10000 });
});
