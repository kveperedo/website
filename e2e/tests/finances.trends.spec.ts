import { expect, test, type Page } from "@playwright/test";
import { addMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import path from "node:path";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { seedTrendsData } from "../helpers/database";

test.describe.configure({ mode: "serial" });

const TIME_ZONE = "Asia/Manila";

function formatMonthAtOffset(offset: number, format: string) {
  const [year, month] = formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM").split("-").map(Number);
  const localMonthStart = fromZonedTime(new Date(year, month - 1, 1, 12), TIME_ZONE);
  return formatInTimeZone(addMonths(localMonthStart, offset), TIME_ZONE, format);
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: path.join(import.meta.dirname, "..", ".auth", "user.json"),
  });

  try {
    await seedTrendsData(await context.newPage());
  } finally {
    await context.close();
  }
});

function waitForPreferenceUpdate(page: Page) {
  return page.waitForResponse(
    (response) => response.request().method() === "POST" && response.ok(),
  );
}

test.describe("category trends card", () => {
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
    const persistedSelection = waitForPreferenceUpdate(page);
    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();

    await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
    await expect(legend.getByText("Transport", { exact: true })).toBeVisible();
    await persistedSelection;

    await gotoAndWaitForHydration(page, "/finances");

    await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
    await expect(legend.getByText("Transport", { exact: true })).toBeVisible();
  });

  test("category trends selection persists when leaving the dashboard", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const card = page.getByTestId("category-trends-card");
    const legend = page.getByTestId("category-trends-legend");
    const navigation = page.getByRole("navigation", { name: "Finance navigation" });
    await card.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("menuitem", { name: "Deselect all" }).click();
    await page.keyboard.press("Escape");
    const persistedBaseline = waitForPreferenceUpdate(page);
    await card.getByRole("button", { name: "Select all categories" }).click();
    await persistedBaseline;
    await page.clock.install();
    await card.getByRole("button", { name: "Filter" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();

    await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    const persistedSelection = waitForPreferenceUpdate(page);
    await navigation.getByRole("link", { name: "Transactions", exact: true }).click();
    await persistedSelection;
    await expect(page).toHaveURL(/\/finances\/transactions$/);
    await navigation.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/finances$/);
    await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
  });
});

test.describe("monthly net card", () => {
  test("dashboard renders signed monthly bars with an income and expense breakdown", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const card = page.getByTestId("monthly-net-card");
    const barAtOffset = (offset: number) =>
      card.getByTestId(`monthly-net-bar-${formatMonthAtOffset(offset, "yyyy-MM")}`);
    await expect(card.getByText("Monthly net")).toBeVisible();
    await expect(card.getByTestId(/monthly-net-bar-/)).toHaveCount(5);
    await expect(card.getByText(formatMonthAtOffset(-4, "MMM"), { exact: true })).toBeVisible();
    const [monthlyNetBounds, categoryTrendsBounds] = await Promise.all([
      card.boundingBox(),
      page.getByTestId("category-trends-card").boundingBox(),
    ]);
    expect(monthlyNetBounds?.width).toBeCloseTo(categoryTrendsBounds?.width ?? 0, 0);

    await barAtOffset(-5).hover();
    await expect(card.getByText("Income", { exact: true })).toBeVisible();
    await expect(card.getByText("Expenses", { exact: true })).toBeVisible();
    await expect(card.getByText("+₱2,300.00", { exact: true })).toBeVisible();
    await expect(card.getByText("₱10,000.00", { exact: true })).toBeVisible();
    await expect(card.getByText("₱7,700.00", { exact: true })).toBeVisible();

    await barAtOffset(-3).hover();
    await expect(card.getByText("-₱8,540.00", { exact: true })).toBeVisible();
    await expect(card.getByText("₱8,540.00", { exact: true })).toBeVisible();

    await barAtOffset(0).hover();
    const currentMonth = formatInTimeZone(new Date(), TIME_ZONE, "MMMM yyyy");
    await expect(card.getByText(`${currentMonth} (month-to-date)`, { exact: true })).toBeVisible();
  });
});
