import type { Page } from "@playwright/test";

export async function waitForHydration(page: Page) {
  await page.waitForSelector("html[data-hydrated]");
}

export async function gotoAndWaitForHydration(page: Page, url: string) {
  await page.goto(url);
  await waitForHydration(page);
}

export async function loginAsAdmin(page: Page) {
  const password = process.env.E2E_PASSWORD;

  if (!password) {
    throw new Error("E2E_PASSWORD environment variable is required for authenticated tests");
  }

  await gotoAndWaitForHydration(page, "/login");
  await page.getByLabel(/password/i).pressSequentially(password);
  await page.getByRole("button", { name: /continue/i }).click();

  await page.waitForURL(/\/finances/, { timeout: 30000 });
}
