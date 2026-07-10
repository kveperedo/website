import { expect, type Page } from "@playwright/test";

import { gotoAndWaitForHydration } from "./auth";

export async function createTransaction(page: Page, text: string): Promise<string> {
  const input = page.getByPlaceholder("Describe your transaction...");
  await input.fill(text);
  await page.getByTestId("parse-transaction").click();

  await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });

  await page.getByRole("button", { name: "Save Transaction" }).click();
  await page.waitForURL(/\/finances\/transactions$/);

  const id = await captureNewestTransactionId(page);
  return id;
}

async function captureNewestTransactionId(page: Page): Promise<string> {
  const id = await page
    .locator("tr[data-transaction-id]")
    .first()
    .getAttribute("data-transaction-id");
  if (!id) {
    throw new Error("Could not find a transaction row id in the DOM");
  }
  return id;
}

export async function openTransactionForEdit(page: Page, id: string) {
  await gotoAndWaitForHydration(page, `/finances/transactions/${id}`);
  await expect(page.getByRole("button", { name: "Delete Transaction" })).toBeVisible();
}

export async function deleteTransaction(page: Page, id: string) {
  await openTransactionForEdit(page, id);

  await page.getByRole("button", { name: "Delete Transaction" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  await page.waitForURL(/\/finances\/transactions$/);
}
