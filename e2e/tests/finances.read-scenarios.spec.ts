import { expect, test, type Page } from "@playwright/test";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { seedDatabase, seedNetCardScenario } from "../helpers/database";

// Each test seeds its own scenario (seeding clears first), so they share the database serially
// and only restore the default seed once for the projects that run after this one.
test.describe.configure({ mode: "serial" });

test.afterAll(async ({ browser }) => {
  const context = await browser.newContext();
  try {
    await seedDatabase(await context.newPage());
  } finally {
    await context.close();
  }
});

async function openTransactionSearch(page: Page) {
  await page.getByRole("button", { name: "Search transactions" }).click();
  return page.getByLabel(/Search .* transactions/);
}

test.describe("seeded scenarios", () => {
  test("monthly totals stay visible, reflect filters, and dim the filtered-out type", async ({
    page,
  }) => {
    await seedNetCardScenario(page, "on-pace");
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const summary = page.getByTestId("transaction-summary");
    const incomeTotal = summary.getByTestId("transaction-summary-income");
    const expensesTotal = summary.getByTestId("transaction-summary-expenses");
    const incomePanel = summary.getByTestId("transaction-summary-income-panel");
    const expensesPanel = summary.getByTestId("transaction-summary-expenses-panel");

    await expect(incomeTotal).toHaveText("₱1,000.00");
    await expect(expensesTotal).toHaveText("₱500.00");
    await expect(incomePanel).not.toHaveAttribute("data-dimmed");
    await expect(expensesPanel).not.toHaveAttribute("data-dimmed");

    const search = await openTransactionSearch(page);
    await search.fill("no matching transaction");
    await expect(page.getByText(/No transactions match/i)).toBeVisible();
    await expect(incomeTotal).toHaveText("₱0.00");
    await expect(expensesTotal).toHaveText("₱0.00");

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(incomeTotal).toHaveText("₱1,000.00");
    await expect(expensesTotal).toHaveText("₱500.00");

    await page.getByRole("link", { name: "Previous month" }).click();
    await expect(incomeTotal).toHaveText("₱0.00");
    await expect(expensesTotal).toHaveText("₱500.00");

    await page.getByRole("button", { name: "Categories", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText(/No transactions match/i)).toBeVisible();
    await expect(summary).toBeVisible();
    await expect(incomeTotal).toHaveText("₱0.00");
    await expect(expensesTotal).toHaveText("₱0.00");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(incomeTotal).toHaveText("₱0.00");
    await expect(expensesTotal).toHaveText("₱500.00");
    await expect(incomePanel).not.toHaveAttribute("data-dimmed");
    await expect(expensesPanel).not.toHaveAttribute("data-dimmed");

    await page.getByRole("radio", { name: "Income", exact: true }).click();
    await expect(incomePanel).not.toHaveAttribute("data-dimmed");
    await expect(expensesPanel).toHaveAttribute("data-dimmed", "");
    await expect(expensesTotal).toHaveText("₱0.00");

    await page.getByRole("radio", { name: "Expenses", exact: true }).click();
    await expect(expensesPanel).not.toHaveAttribute("data-dimmed");
    await expect(incomePanel).toHaveAttribute("data-dimmed", "");
    await expect(incomeTotal).toHaveText("₱0.00");
    await expect(expensesTotal).toHaveText("₱500.00");
  });

  test("net card renders its conditional comparison states", async ({ page }) => {
    await seedNetCardScenario(page, "over-income");
    await gotoAndWaitForHydration(page, "/finances");
    await expect(page.getByText("₱1,200.00 over income", { exact: true })).toBeVisible();
    await expect(page.getByText("No income recorded this month")).toBeVisible();
    await expect(page.getByText("No historical data for comparison")).toBeVisible();

    await seedNetCardScenario(page, "below-pace");
    await gotoAndWaitForHydration(page, "/finances");
    await expect(page.getByText("₱400.00 below your 1-month pace", { exact: true })).toBeVisible();

    await seedNetCardScenario(page, "on-pace");
    await gotoAndWaitForHydration(page, "/finances");
    await expect(
      page.getByText("On pace with your 1-month average", { exact: true }),
    ).toBeVisible();

    await seedNetCardScenario(page, "no-history");
    await gotoAndWaitForHydration(page, "/finances");
    await expect(page.getByText("No historical data for comparison")).toBeVisible();
  });
});
