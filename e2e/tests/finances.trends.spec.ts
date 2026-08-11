import { expect, test } from "@playwright/test";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { seedTrendsData } from "../helpers/database";

test.describe.configure({ mode: "serial" });

test.describe("category trends card", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await seedTrendsData(page);
    await context.close();
  });

  test("dashboard shows the category trends card", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    await expect(page.getByText("Category trends")).toBeVisible();
  });

  test("category trends card renders a line chart", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const chart = page.locator('[data-slot="chart"]').last();
    await expect(chart).toBeVisible();

    const lines = chart.locator(".recharts-line");
    await expect(lines.first()).toBeVisible();
  });

  test("category trends legend shows categories", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    await expect(page.getByRole("button", { name: "Food & Drinks" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Groceries" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Transport" })).toBeVisible();
  });
});
