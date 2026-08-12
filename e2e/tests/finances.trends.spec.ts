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

    const legend = page.getByTestId("category-trends-legend");
    await expect(legend.getByText("Food & Drinks", { exact: true })).toBeVisible();
    await expect(legend.getByText("Groceries", { exact: true })).toBeVisible();
    await expect(legend.getByText("Transport", { exact: true })).toBeVisible();
  });

  test("category trends filter shows an empty state and can restore all categories", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const card = page.getByTestId("category-trends-card");
    await card.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("menuitem", { name: "Deselect all" }).click();

    await expect(page.getByRole("menu")).toBeVisible();
    await expect(card.getByText("No categories selected.")).toBeVisible();
    await expect(card.locator(".recharts-line")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await card.getByRole("button", { name: "Select all categories" }).click();
    await expect(card.locator(".recharts-line")).toHaveCount(7);
    await expect(card.getByText("No categories selected.")).toHaveCount(0);
  });

  test("category trends filter toggles individual series and legend labels", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const card = page.getByTestId("category-trends-card");
    const legend = page.getByTestId("category-trends-legend");
    await card.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();

    await expect(card.locator(".recharts-line")).toHaveCount(6);
    await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
    await expect(legend.getByText("Transport", { exact: true })).toBeVisible();

    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();
    await expect(card.locator(".recharts-line")).toHaveCount(7);
    await expect(legend.getByText("Food & Drinks", { exact: true })).toBeVisible();
  });

  test("category trends filter persists selected categories after reload", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const card = page.getByTestId("category-trends-card");
    const legend = page.getByTestId("category-trends-legend");
    await card.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("menuitem", { name: "Deselect all" }).click();
    await page.keyboard.press("Escape");
    await card.getByRole("button", { name: "Select all categories" }).click();
    await card.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();

    await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
    await expect(legend.getByText("Transport", { exact: true })).toBeVisible();
    await page.waitForTimeout(1000);

    await gotoAndWaitForHydration(page, "/finances");

    await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
    await expect(legend.getByText("Transport", { exact: true })).toBeVisible();
  });
});
