import { expect, test, type Page } from "@playwright/test";

import { gotoAndWaitForHydration } from "../helpers/auth";
import {
  createTransaction,
  deleteTransaction,
  openTransactionForEdit,
} from "../helpers/transactions";

const descriptionField = (page: Page) => page.getByTestId("description-input");

test.describe.configure({ mode: "serial", timeout: 120000 });

test.describe("transaction mutations", () => {
  test("AI parse then save creates a transaction", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const id = await createTransaction(page, "Milk 75");
    await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toBeVisible();
    await deleteTransaction(page, id);
  });

  test("new transaction form reflects type and category", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const input = page.getByPlaceholder("Describe your transaction...");
    await input.fill("Milk 75");
    await page.getByTestId("parse-transaction").click();
    await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });

    const categoryField = page.getByText("Category", { exact: true });
    const foodToggle = page.getByRole("radio", { name: "Food & Drinks" });

    await expect(categoryField).toBeVisible();

    await foodToggle.click();
    await expect(foodToggle).toHaveAttribute("aria-checked", "true");

    await page.getByTestId("income-radio-item").click();
    await expect(categoryField).toHaveCount(0);

    await page.getByTestId("expense-radio-item").click();
    await expect(categoryField).toBeVisible();
  });

  test("updating a transaction persists the changes", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const id = await createTransaction(page, "Bread 40");
    const updated = "Bread edited";
    await openTransactionForEdit(page, id);
    await descriptionField(page).fill(updated);

    const saveButton = page.getByRole("button", { name: "Save Changes" });
    await saveButton.click();
    await expect(saveButton).toBeDisabled();
    await expect(saveButton).toBeEnabled();

    await expect(descriptionField(page)).toHaveValue(updated);
    await deleteTransaction(page, id);
  });

  test("deleting a transaction removes it from the list", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const id = await createTransaction(page, "Soda 30");
    await deleteTransaction(page, id);
    await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toHaveCount(0);
  });

  test("delete confirmation dialog opens and Cancel dismisses it", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const id = await createTransaction(page, "Tea 20");
    await openTransactionForEdit(page, id);

    await page.getByRole("button", { name: "Delete Transaction" }).click();
    await expect(page.getByText("Delete this transaction?")).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Delete this transaction?")).toHaveCount(0);

    await expect(page).toHaveURL(new RegExp(`/finances/transactions/${id}`));
    await expect(page.getByRole("button", { name: "Delete Transaction" })).toBeVisible();
    await deleteTransaction(page, id);
  });

  test("parsing from the dashboard creates a transaction and returns to the dashboard", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/finances");

    const input = page.getByPlaceholder("Describe your transaction...");
    await input.fill("Eggs 55");
    await page.getByTestId("parse-transaction").click();
    await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });

    await page.getByRole("button", { name: "Save Transaction" }).click();
    await page.waitForURL(/\/finances(\/?$|\?)/, { timeout: 30000 });

    const id = await page
      .locator("tr[data-transaction-id]")
      .first()
      .getAttribute("data-transaction-id");
    await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toBeVisible();
  });
});
