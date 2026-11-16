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

test("login returns to the page that required authentication", async ({ page }) => {
  const password = process.env.E2E_PASSWORD;

  if (!password) {
    throw new Error("E2E_PASSWORD environment variable is required for authenticated tests");
  }

  await gotoAndWaitForHydration(page, "/finances/transactions");

  await expect(page).toHaveURL(/\/login\?from=/);
  await expect(page.getByLabel(/password/i)).toBeVisible();

  await page.getByLabel(/password/i).pressSequentially(password);
  await page.getByRole("button", { name: /continue/i }).click();

  await page.waitForURL((url) => url.pathname === "/finances/transactions", {
    timeout: 30000,
  });
});
