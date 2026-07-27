import { expect, test } from "@playwright/test";
import { format } from "date-fns";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { resetDatabase } from "../helpers/database";

test.describe.configure({ mode: "serial" });

test.describe("empty states", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await resetDatabase(page);
    await context.close();
  });

  test("dashboard shows empty recent transactions and category summaries", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    await expect(page.getByText("No transactions this month.")).toHaveCount(2);
    await expect(page.getByText("No expenses recorded this month.")).toBeVisible();
  });

  test("dashboard links from empty upcoming transactions to scheduled management", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");

    await expect(page.getByText("No upcoming transactions.")).toBeVisible();
    await page.getByRole("link", { name: "Manage scheduled transactions" }).click();

    await expect(page).toHaveURL(/\/finances\/scheduled$/);
    await expect(page.getByRole("heading", { name: "Scheduled Transactions" })).toBeVisible();
    await expect(page.getByText("No scheduled transactions.")).toBeVisible();
  });

  test("transactions list shows an empty state for the current month", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const monthLabel = format(new Date(), "MMMM yyyy");
    await expect(page.getByText(`No transactions in ${monthLabel}.`)).toBeVisible();
  });

  test("search with no matches shows an empty state", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const search = page.getByLabel(/Search .* transactions/);
    await search.fill("zzqx_no_such_transaction_xyz");
    await search.press("Enter");

    await expect(page.getByText(/No transactions match/i)).toBeVisible();
  });
});
