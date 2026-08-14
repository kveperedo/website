import { expect, test, type Page } from "@playwright/test";
import { addMonths, format, getDaysInMonth, subMonths } from "date-fns";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { resetDatabase, seedDatabase, seedNetCardScenario } from "../helpers/database";
import { openTransactionComposer } from "../helpers/transactions";

async function openTransactionSearch(page: Page) {
  await page.getByRole("button", { name: "Search transactions" }).click();
  return page.getByLabel(/Search .* transactions/);
}

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
    await expect(page.getByText(`Your ${monthLabel} finances so far`)).toBeVisible();
  });

  test("dashboard opens the transaction composer with a disabled parse button when empty", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");
    await expect(page.getByPlaceholder("Add transaction...")).toHaveCount(0);

    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await expect(input).toBeVisible();

    const parseButton = page.getByTestId("parse-transaction");
    await expect(parseButton).toBeDisabled();
  });

  test("footer navigation changes sections and closes an unsubmitted composer", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
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
      page.getByText(/Spending breakdown|No expenses recorded this month/i),
    ).toBeVisible();
  });
});

test.describe("transactions", () => {
  test("transactions page is accessible", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("transactions page has a title and expandable search for the current month", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const monthLabel = format(new Date(), "MMMM yyyy");
    await expect(page).toHaveTitle(new RegExp(`${monthLabel} Transactions`));
    await page.getByRole("button", { name: "Search transactions" }).click();
    await expect(page.getByLabel(`Search ${monthLabel} transactions`)).toBeVisible();
  });

  test("previous month navigation updates the URL and month label", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await page.getByRole("link", { name: "Previous month" }).click();
    await expect(page).toHaveURL(/\/finances\/transactions\?.*(year|month)=/);

    const prevLabel = format(subMonths(new Date(), 1), "MMMM yyyy");
    await expect(page.getByText(prevLabel, { exact: true })).toBeVisible();
  });

  test("next month navigation updates the URL and month label", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const nextMonth = page.getByRole("link", { name: "Next month" });
    await expect(nextMonth).toBeEnabled();
    await nextMonth.click();

    await expect(page).toHaveURL(/\/finances\/transactions\?.*(year|month)=/);

    const nextLabel = format(addMonths(new Date(), 1), "MMMM yyyy");
    await expect(page.getByText(nextLabel, { exact: true })).toBeVisible();
  });

  test("typing a search query updates the URL without Enter", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const search = await openTransactionSearch(page);
    await search.fill("coffee");

    await expect(page).toHaveURL(/q=coffee/);
  });

  test("Escape cancels pending search changes", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await page.clock.install();

    const search = await openTransactionSearch(page);
    await search.fill("coffee");
    await search.press("Escape");

    await expect(search).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Search transactions" })).toBeFocused();
    await page.clock.fastForward(500);
    await expect(page).not.toHaveURL(/q=coffee/);

    await gotoAndWaitForHydration(page, "/finances/transactions?q=Client");
    const editedSearch = page.getByLabel(/Search .* transactions/);
    await editedSearch.fill("Client dinner");
    await editedSearch.press("Escape");

    await expect(editedSearch).toHaveValue("Client");
    await expect(page).toHaveURL(/q=Client(?:$|&)/);
    await page.clock.fastForward(500);
    await expect(page).toHaveURL(/q=Client(?:$|&)/);
  });

  test("type and category filters update the results and URL", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await page.getByRole("radio", { name: "Expenses", exact: true }).click();
    await expect(page).toHaveURL(/type=expense/);

    await page.getByRole("button", { name: "Categories", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();
    await expect(page).toHaveURL(/categories=.*food_drinks/);
    await expect(page.getByRole("link", { name: /Client dinner/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Groceries run/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Salary/ })).toHaveCount(0);
  });

  test("Cancel returns to the filtered transaction list", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    await page.getByRole("radio", { name: "Expenses", exact: true }).click();
    await expect(page).toHaveURL(/type=expense/);
    const search = await openTransactionSearch(page);
    await search.fill("Client");
    await expect(page).toHaveURL(/q=Client/);
    await expect(page.getByRole("link", { name: /Client dinner/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Groceries run/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Categories", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Food & Drinks" }).click();
    await expect(page).toHaveURL(/categories=.*food_drinks/);
    await expect(page.getByRole("menuitemcheckbox", { name: "Food & Drinks" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.keyboard.press("Escape");

    const listUrl = page.url();
    await page.getByRole("link", { name: /Client dinner/ }).click();
    await expect(page).toHaveURL(/\/finances\/transactions\/.+/);
    await expect(page).toHaveURL(/q=Client/);
    await expect(page).toHaveURL(/type=expense/);
    await expect(page).toHaveURL(/categories=.*food_drinks/);

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(listUrl);
    await expect(page.getByRole("link", { name: /Client dinner/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Groceries run/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Salary/ })).toHaveCount(0);
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
    await expect(page).toHaveURL(/\/finances\/transactions\?year=\d+&month=\d+$/);

    await gotoAndWaitForHydration(page, transactionUrl);
    await expect(page.getByTestId("description-input")).toHaveValue(originalDescription);
  });

  test("clear search button removes the query from the URL and input", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const search = await openTransactionSearch(page);
    await search.fill("coffee");
    await expect(page).toHaveURL(/q=coffee/);

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(search).toHaveCount(0);
    await expect(page).not.toHaveURL(/q=coffee/);
  });

  test("search with no matches shows an empty state", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const search = await openTransactionSearch(page);
    await search.fill("zzqx_no_such_transaction_xyz");

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
    await expect(page.getByText(currentLabel, { exact: true })).toBeVisible();
  });
});

test.describe("mobile finance layout", () => {
  test.use({ viewport: { width: 390, height: 320 } });

  test("footer keeps the composer and navigation reachable after scrolling", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    const addTransaction = page.getByRole("button", { name: "Add transaction" });
    await expect(addTransaction).toBeInViewport();
    await addTransaction.press("Enter");
    const input = page.getByPlaceholder("Add transaction...");
    await expect(input).toBeInViewport();

    const navigation = page.getByRole("navigation", { name: "Finance navigation" });
    const scheduledLink = navigation.getByRole("link", { name: "Scheduled", exact: true });
    await expect(scheduledLink).toBeInViewport();
    await scheduledLink.click();
    await expect(page).toHaveURL(/\/finances\/scheduled$/);
    await expect(input).toHaveCount(0);
  });

  test("editor footer actions remain reachable after scrolling", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await page.locator("tr[data-transaction-id]").first().click();
    await expect(page).toHaveURL(/\/finances\/transactions\/.+/);

    await page.evaluate(() => window.scrollTo(0, 200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    const cancel = page.getByRole("button", { name: "Cancel" });
    await expect(cancel).toBeInViewport();
    const saveChanges = page.getByRole("button", { name: "Save Changes" });
    await expect(saveChanges).toBeInViewport();

    await cancel.press("Enter");
    await expect(page).toHaveURL(/\/finances\/transactions\?year=\d+&month=\d+$/);
  });
});

test.describe("dashboard with data", () => {
  test("dashboard groups upcoming scheduled transactions by month", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const now = new Date();
    const currentMonthLabel = format(now, "MMMM");
    const nextMonthLabel = format(addMonths(now, 1), "MMMM");
    const nextMonth = page.getByRole("region", { name: nextMonthLabel });

    await expect(nextMonth).toContainText("Spotify subscription");
    await expect(nextMonth).toContainText("Google One storage");

    if (now.getDate() < getDaysInMonth(now)) {
      const currentMonth = page.getByRole("region", { name: currentMonthLabel });
      await expect(currentMonth).toContainText("Internet bill");
      await expect(currentMonth).not.toContainText("Google One storage");
    }
  });

  test("net card shows the current month label with data", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const monthLabel = format(new Date(), "MMMM yyyy");
    await expect(page.getByText(`Your ${monthLabel} finances so far`)).toBeVisible();
  });

  test("net card shows the seeded net amount, percentage, and pace", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const now = new Date();
    const expenses =
      750 +
      (now.getDate() >= 2 ? 1500 : 0) +
      (now.getDate() >= 5 ? 850 : 0) +
      (now.getDate() === getDaysInMonth(now) ? 180 : 0);
    const formatCurrency = (amount: number) =>
      `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

    await expect(
      page.getByText(`${formatCurrency(45000 - expenses)} left`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(`Expenses are ${Math.round((expenses / 45000) * 100)}% of income`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(`${formatCurrency(expenses)} / ${formatCurrency(45000)}`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Expenses as a percentage of income" }),
    ).toHaveAttribute("aria-valuenow", String(Math.round((expenses / 45000) * 100)));
    await expect(
      page.getByText(`${formatCurrency(expenses - 750)} above your 1-month pace`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("₱750.00", { exact: true })).toBeVisible();
    await expect(page.getByText(/spent$/)).toHaveCount(0);
  });

  test("net card renders its conditional comparison states", async ({ page }) => {
    try {
      await seedNetCardScenario(page, "over-income");
      await gotoAndWaitForHydration(page, "/finances");
      await expect(page.getByText("₱1,200.00 over income", { exact: true })).toBeVisible();
      await expect(page.getByText("No income recorded this month")).toBeVisible();
      await expect(page.getByText("No historical data for comparison")).toBeVisible();

      await seedNetCardScenario(page, "below-pace");
      await gotoAndWaitForHydration(page, "/finances");
      await expect(
        page.getByText("₱400.00 below your 1-month pace", { exact: true }),
      ).toBeVisible();

      await seedNetCardScenario(page, "on-pace");
      await gotoAndWaitForHydration(page, "/finances");
      await expect(
        page.getByText("On pace with your 1-month average", { exact: true }),
      ).toBeVisible();

      await seedNetCardScenario(page, "no-history");
      await gotoAndWaitForHydration(page, "/finances");
      await expect(page.getByText("No historical data for comparison")).toBeVisible();
    } finally {
      await resetDatabase(page);
      await seedDatabase(page);
    }
  });

  test("recent transactions 'View all' button navigates to the transactions list", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");
    await page.getByRole("link", { name: "View all transactions" }).click();
    await expect(page).toHaveURL(/\/finances\/transactions$/);
  });
});
