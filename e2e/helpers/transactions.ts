import { expect, type Page } from "@playwright/test";
import { format } from "date-fns";

import { gotoAndWaitForHydration } from "./auth";

type ScheduleEnd =
  | { endType: "none" }
  | { endType: "count"; maxOccurrences: number }
  | { endType: "date"; endDate: Date };

const PARSE_TEXT = "Test purchase 75";

export async function openTransactionComposer(page: Page) {
  await page.getByRole("button", { name: "Add transaction" }).press("Enter");
  await expect(page.getByPlaceholder("Describe your transaction...")).toBeVisible();
}

async function expectParsedDateToBeToday(page: Page) {
  const { year, month, day } = await page.evaluate(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  });
  const today = format(new Date(year, month, day), "MMMM do, yyyy");

  await expect(page.getByRole("button", { name: "Date" })).toContainText(today);
}

export async function createTransaction(
  page: Page,
  text: string,
  description = text,
): Promise<string> {
  await openTransactionComposer(page);
  const input = page.getByPlaceholder("Describe your transaction...");
  await input.fill(text);
  await page.getByTestId("parse-transaction").click();

  await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });
  await expectParsedDateToBeToday(page);
  await page.getByTestId("description-input").fill(description);

  await page.getByRole("button", { name: "Save Transaction" }).click();
  await page.waitForURL(/\/finances\/transactions$/);

  return getTransactionId(page, description);
}

export async function createScheduledTransaction(
  page: Page,
  description: string,
  scheduleEnd: ScheduleEnd = { endType: "count", maxOccurrences: 3 },
): Promise<string> {
  await openTransactionComposer(page);
  const input = page.getByPlaceholder("Describe your transaction...");
  await input.fill(PARSE_TEXT);
  await page.getByTestId("parse-transaction").click();

  await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });
  await expectParsedDateToBeToday(page);
  await page.getByTestId("description-input").fill(description);
  const scheduleCheckbox = page.getByRole("checkbox", { name: "Schedule transaction" });
  await page.getByText("Schedule transaction", { exact: true }).click();
  await expect(scheduleCheckbox).toBeChecked();

  if (scheduleEnd.endType === "count") {
    const endAfterCount = page.getByRole("radio", { name: "After N occurrences" });
    await page.getByText("After N occurrences", { exact: true }).click();
    await expect(endAfterCount).toBeChecked();
    await page.getByLabel("Number of occurrences").fill(scheduleEnd.maxOccurrences.toString());
  }

  if (scheduleEnd.endType === "date") {
    const endOnDate = page.getByRole("radio", { name: "On date" });
    await page.getByText("On date", { exact: true }).click();
    await expect(endOnDate).toBeChecked();

    const endDatePicker = page.getByRole("button", { name: "End date" });
    await endDatePicker.click();

    const calendar = page.getByRole("dialog");
    await calendar.locator('button[slot="next"]').click();
    await calendar
      .getByRole("gridcell", {
        name: format(scheduleEnd.endDate, "EEEE, MMMM d, yyyy"),
        exact: true,
      })
      .click();
    await expect(endDatePicker).toContainText(format(scheduleEnd.endDate, "PPP"));
  }

  if (scheduleEnd.endType === "none") {
    await expect(page.getByRole("radio", { name: "Never" })).toBeChecked();
  }

  await page.getByRole("button", { name: "Save Transaction" }).click();
  await page.waitForURL(/\/finances$/);

  return getTransactionId(page, description);
}

export async function getTransactionId(page: Page, description: string): Promise<string> {
  const row = page.locator("tr[data-transaction-id]", { hasText: description });
  await expect(row).toHaveCount(1);

  const id = await row.getAttribute("data-transaction-id");
  if (!id) {
    throw new Error(`Could not find the id for transaction: ${description}`);
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

export async function deleteScheduledTransactionTemplate(page: Page, description: string) {
  await gotoAndWaitForHydration(page, "/finances/scheduled");

  const template = page.getByRole("group", { name: description });
  if ((await template.count()) === 0) {
    return;
  }

  await template.getByRole("button", { name: "Delete template" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(template).toHaveCount(0);
}

export async function deleteTransactionByDescription(page: Page, description: string) {
  await gotoAndWaitForHydration(page, "/finances/transactions");

  const row = page.locator("tr[data-transaction-id]", { hasText: description });
  if ((await row.count()) === 0) {
    return;
  }

  const id = await row.getAttribute("data-transaction-id");
  if (!id) {
    throw new Error(`Could not find the id for transaction: ${description}`);
  }

  await deleteTransaction(page, id);
}
