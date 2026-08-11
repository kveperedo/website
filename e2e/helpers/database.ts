import { type Page } from "@playwright/test";

import { gotoAndWaitForHydration } from "./auth";

const statusText = {
  reset: "Database reset successfully.",
  seed: "Database seeded successfully.",
  seedTrends: "Trends data seeded successfully.",
} as const;

export async function resetDatabase(page: Page) {
  await gotoAndWaitForHydration(page, "/e2e");
  await page.getByTestId("reset-database").click();
  await page.getByTestId("confirm-reset").click();
  await page.getByText(statusText.reset).waitFor({ state: "visible", timeout: 15000 });
}

export async function seedDatabase(page: Page) {
  await gotoAndWaitForHydration(page, "/e2e");
  await page.getByTestId("seed-database").click();
  await page.getByTestId("confirm-seed").click();
  await page.getByText(statusText.seed).waitFor({ state: "visible", timeout: 15000 });
}

export async function seedTrendsData(page: Page) {
  await gotoAndWaitForHydration(page, "/e2e");
  await page.getByTestId("seed-trends").click();
  await page.getByTestId("confirm-seed-trends").click();
  await page.getByText(statusText.seedTrends).waitFor({ state: "visible", timeout: 15000 });
}
