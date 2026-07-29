import { expect, test } from "@playwright/test";
import { format, subMonths } from "date-fns";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { openTransactionComposer } from "../helpers/transactions";

test.describe.configure({ mode: "serial" });

test.describe("dashboard", () => {
  test("finances dashboard loads after login", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    await expect(page).toHaveTitle(/Finances/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("dashboard shows the current month", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const monthLabel = format(new Date(), "MMMM yyyy");
    await expect(
      page.getByRole("paragraph").filter({ hasText: new RegExp(`^${monthLabel}$`) }),
    ).toBeVisible();
  });

  test("dashboard opens the transaction composer with a disabled parse button when empty", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");
    await expect(page.getByPlaceholder("Describe your transaction...")).toHaveCount(0);

    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Describe your transaction...");
    await expect(input).toBeVisible();

    const parseButton = page.getByTestId("parse-transaction");
    await expect(parseButton).toBeDisabled();
  });

  test("footer navigation changes sections and closes an unsubmitted composer", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Describe your transaction...");
    const navigation = page.getByRole("navigation", { name: "Finance navigation" });
    await input.fill("Coffee 120");
    await navigation.getByRole("link", { name: "Transactions", exact: true }).click();

    await expect(page).toHaveURL(/\/finances\/transactions$/);
    await expect(input).toHaveCount(0);
    await expect(
      navigation.getByRole("link", { name: "Transactions", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    await navigation.getByRole("link", { name: "Scheduled", exact: true }).click();
    await expect(page).toHaveURL(/\/finances\/scheduled$/);
    await expect(navigation.getByRole("link", { name: "Scheduled", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await navigation.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/finances$/);
    await expect(navigation.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("dashboard shows the recent transactions card", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    await expect(page.getByText(/Recent transactions|No transactions this month/i)).toBeVisible();
  });

  test("dashboard shows the category summary card", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    await expect(
      page.getByText(/Spending by category|No expenses recorded this month/i),
    ).toBeVisible();
  });

  test("dashboard generates each due scheduled transaction once", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const dueTransaction = page.locator("tr[data-transaction-id]", {
      hasText: "E2E due scheduled transaction",
    });
    await expect(dueTransaction).toHaveCount(1);
    await expect(dueTransaction.getByRole("img", { name: "Scheduled transaction" })).toBeVisible();

    await gotoAndWaitForHydration(page, "/finances");
    await expect(dueTransaction).toHaveCount(1);
  });
});

test.describe("transactions", () => {
  test("transactions page is accessible", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("transactions page has a title and search input for the current month", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const monthLabel = format(new Date(), "MMMM yyyy");
    await expect(page).toHaveTitle(new RegExp(`${monthLabel} Transactions`));
    await expect(page.getByLabel(`Search ${monthLabel} transactions`)).toBeVisible();
  });

  test("previous month navigation updates the URL and month label", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await page.getByRole("link", { name: "Previous month" }).click();
    await expect(page).toHaveURL(/\/finances\/transactions\?.*(year|month)=/);

    const prevLabel = format(subMonths(new Date(), 1), "MMMM yyyy");
    await expect(page.getByLabel(`Search ${prevLabel} transactions`)).toBeVisible();
  });

  test("next month button is disabled on the current month", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await expect(page.getByRole("link", { name: "Next month" })).toBeDisabled();
  });

  test("typing a search query updates the URL", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const search = page.getByLabel(/Search .* transactions/);
    await search.fill("coffee");
    await search.press("Enter");

    await expect(page).toHaveURL(/q=coffee/);
  });

  test("clicking a transaction row opens the edit page", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await page.locator("tr[data-transaction-id]").first().click();
    await expect(page).toHaveURL(/\/finances\/transactions\/.+/);

    await expect(page).toHaveTitle(/Edit /);
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete Transaction" })).toBeVisible();
  });

  test("Cancel discards edits and returns to the transactions list", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await page.locator("tr[data-transaction-id]").first().click();
    await expect(page).toHaveURL(/\/finances\/transactions\/.+/);

    await expect(page.getByRole("button", { name: "Delete Transaction" })).toBeVisible();
    const originalDescription = await page.getByTestId("description-input").inputValue();
    const transactionUrl = page.url();
    await page.getByTestId("description-input").fill("Unsaved description");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/finances\/transactions$/);

    await gotoAndWaitForHydration(page, transactionUrl);
    await expect(page.getByTestId("description-input")).toHaveValue(originalDescription);
  });

  test("clear search button removes the query from the URL and input", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const search = page.getByLabel(/Search .* transactions/);
    await search.fill("coffee");
    await search.press("Enter");
    await expect(page).toHaveURL(/q=coffee/);

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(search).toHaveValue("");
    await expect(page).not.toHaveURL(/q=coffee/);
  });

  test("search with no matches shows an empty state", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const search = page.getByLabel(/Search .* transactions/);
    await search.fill("zzqx_no_such_transaction_xyz");
    await search.press("Enter");

    await expect(page.getByText(/No transactions match/i)).toBeVisible();
  });

  test("next month button is enabled on a previous month and returns to the current month", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await page.getByRole("link", { name: "Previous month" }).click();
    await expect(page).toHaveURL(/\/finances\/transactions\?.*(year|month)=/);

    const nextMonth = page.getByRole("link", { name: "Next month" });
    await expect(nextMonth).toBeEnabled();
    await nextMonth.click();

    const currentLabel = format(new Date(), "MMMM yyyy");
    await expect(page.getByLabel(`Search ${currentLabel} transactions`)).toBeVisible();
  });
});

test.describe("dashboard with data", () => {
  test("recent transactions 'View all' button navigates to the transactions list", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");
    await page.getByRole("link", { name: "View all transactions" }).click();
    await expect(page).toHaveURL(/\/finances\/transactions$/);
  });
});
