import { expect, type Page } from "@playwright/test";

type NetCardScenario = "below-pace" | "no-history" | "on-pace" | "over-income";

type SeedAction =
  | { action: "reset" }
  | { action: "seed"; scenario?: NetCardScenario }
  | { action: "seed-trends" };

/** Runs the `/e2e` page's operations through `/api/e2e/seed`, skipping the page load. */
async function runSeedAction(page: Page, data: SeedAction) {
  const response = await page.request.post("/api/e2e/seed", { data });
  expect(response.status(), await response.text()).toBe(204);
}

export async function resetDatabase(page: Page) {
  await runSeedAction(page, { action: "reset" });
}

export async function seedDatabase(page: Page) {
  await runSeedAction(page, { action: "seed" });
}

export async function seedNetCardScenario(page: Page, scenario: NetCardScenario) {
  await runSeedAction(page, { action: "seed", scenario });
}

export async function seedTrendsData(page: Page) {
  await runSeedAction(page, { action: "seed-trends" });
}
