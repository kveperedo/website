import { expect, test, type Page } from "@playwright/test";
import { addMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import path from "node:path";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { resetFinancePreferences, seedTrendsData, setCategoryTrends } from "../helpers/database";

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

function waitForPreferenceUpdate(page: Page, predicate: (body: string) => boolean = () => true) {
    return page.waitForResponse((response) => {
        if (response.request().method() !== "POST" || !response.ok()) {
            return false;
        }
        const postData = response.request().postData();
        return postData ? predicate(postData) : false;
    });
}

const ALL_CATEGORIES = [
    "food_drinks",
    "groceries_household",
    "transportation",
    "bills_utilities",
    "health_wellness",
    "hobbies_lifestyle",
    "financial",
];
const WITHOUT_FOOD_AND_DRINKS = ALL_CATEGORIES.filter((category) => category !== "food_drinks");

test.describe("category trends card", () => {
    test.beforeEach(async ({ page }) => {
        await resetFinancePreferences(page);
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
        await setCategoryTrends(page, []);
        await gotoAndWaitForHydration(page, "/finances");

        const card = page.getByTestId("category-trends-card");
        await expect(card.getByText("No categories selected.")).toBeVisible();
        await expect(card.locator(".recharts-line")).toHaveCount(0);

        const persistedAllCategories = waitForPreferenceUpdate(
            page,
            (body) => body.includes("food_drinks") && body.includes("bills_utilities"),
        );
        await card.getByRole("button", { name: "Select all categories" }).click();
        await persistedAllCategories;
        await expect(card.locator(".recharts-line")).toHaveCount(7);
        await expect(card.getByText("No categories selected.")).toHaveCount(0);
    });

    test("category trends renders only the selected series and legend labels", async ({ page }) => {
        await setCategoryTrends(page, WITHOUT_FOOD_AND_DRINKS);
        await gotoAndWaitForHydration(page, "/finances");

        const card = page.getByTestId("category-trends-card");
        const legend = page.getByTestId("category-trends-legend");
        await expect(card.locator(".recharts-line")).toHaveCount(6);
        await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
        await expect(legend.getByText("Transport", { exact: true })).toBeVisible();

        await setCategoryTrends(page, ALL_CATEGORIES);
        await gotoAndWaitForHydration(page, "/finances");
        await expect(card.locator(".recharts-line")).toHaveCount(7);
        await expect(legend.getByText("Food & Drinks", { exact: true })).toBeVisible();
    });

    test("category trends selection persists after reload", async ({ page }) => {
        await setCategoryTrends(page, WITHOUT_FOOD_AND_DRINKS);
        await gotoAndWaitForHydration(page, "/finances");

        const legend = page.getByTestId("category-trends-legend");
        await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
        await expect(legend.getByText("Transport", { exact: true })).toBeVisible();

        await gotoAndWaitForHydration(page, "/finances");

        await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);
        await expect(legend.getByText("Transport", { exact: true })).toBeVisible();
    });

    test("category trends selection persists when leaving the dashboard", async ({ page }) => {
        await setCategoryTrends(page, WITHOUT_FOOD_AND_DRINKS);
        await gotoAndWaitForHydration(page, "/finances");

        const legend = page.getByTestId("category-trends-legend");
        const navigation = page.getByRole("navigation", { name: "Finance navigation" });
        await expect(legend.getByText("Food & Drinks", { exact: true })).toHaveCount(0);

        await navigation.getByRole("link", { name: "Transactions", exact: true }).click();
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
        await expect(card.getByRole("application", { name: "Monthly net by month" })).toContainText(
            "0",
        );
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
        await expect(card.getByText("+₱2,300.01", { exact: true })).toBeVisible();
        await expect(card.getByText("₱10,000.01", { exact: true })).toBeVisible();
        await expect(card.getByText("₱7,700.00", { exact: true })).toBeVisible();

        await barAtOffset(-3).hover();
        await expect(card.getByText("-₱8,540.00", { exact: true })).toBeVisible();
        await expect(card.getByText("₱8,540.00", { exact: true })).toBeVisible();

        await barAtOffset(0).hover();
        const currentMonth = formatInTimeZone(new Date(), TIME_ZONE, "MMMM yyyy");
        await expect(
            card.getByText(`${currentMonth} (month-to-date)`, { exact: true }),
        ).toBeVisible();
    });
});

test.describe("summary card amounts visibility", () => {
    test("eye toggle masks the summary amounts and the preference survives a reload", async ({
        page,
    }) => {
        // Start from a fresh preferences row so creating one from the toggle is what is exercised.
        await seedTrendsData(page);
        await gotoAndWaitForHydration(page, "/finances");

        const toggle = page.getByTestId("amounts-visibility-toggle");
        const netHeadline = page.getByTestId("net-headline");

        await expect(toggle).toHaveAccessibleName("Hide amounts");
        await expect(netHeadline).toContainText(/₱\d/);

        const hidden = waitForPreferenceUpdate(page);
        await toggle.click();
        await hidden;

        await expect(toggle).toHaveAccessibleName("Show amounts");
        await expect(netHeadline).toContainText(/₱•/);
        await expect(netHeadline).not.toContainText(/₱\d/);

        await gotoAndWaitForHydration(page, "/finances");

        await expect(toggle).toHaveAccessibleName("Show amounts");
        await expect(netHeadline).toContainText(/₱•/);
        // Saving the hide preference must not look like an empty category trends filter.
        const categoryTrends = page.getByTestId("category-trends-card");
        await expect(categoryTrends).not.toContainText("No categories selected.");
        await expect(categoryTrends.locator(".recharts-line")).toHaveCount(7);

        const shown = waitForPreferenceUpdate(page);
        await toggle.click();
        await shown;

        await expect(toggle).toHaveAccessibleName("Hide amounts");
        await expect(netHeadline).toContainText(/₱\d/);
    });
});
