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
  await expect(page.getByPlaceholder("Add transaction...")).toBeVisible();
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
  const input = page.getByPlaceholder("Add transaction...");
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
  const input = page.getByPlaceholder("Add transaction...");
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
    await expect(calendar).toBeVisible();
    const targetName = format(scheduleEnd.endDate, "EEEE, MMMM d, yyyy");
    for (let attempt = 0; attempt < 12; attempt++) {
      const cell = calendar.getByRole("gridcell", { name: targetName, exact: true });
      if ((await cell.count()) > 0) {
        await cell.click();
        break;
      }
      await calendar.locator('button[slot="next"]').click();
      await expect(calendar).toBeVisible();
      if (attempt === 11) {
        throw new Error(`Could not find calendar cell for ${targetName}`);
      }
    }
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

export async function archiveScheduledTransactionTemplate(page: Page, description: string) {
  // Try main list first
  await gotoAndWaitForHydration(page, "/finances/scheduled");
  let template = page.getByRole("listitem").filter({ hasText: description });
  if ((await template.count()) > 0) {
    await template.getByRole("button", { name: "Archive template" }).click();
    const archiveButton = page.getByRole("button", { name: "Archive", exact: true });
    await expect(archiveButton).toBeEnabled();
    await archiveButton.click({ timeout: 10000 });
    await expect(template).toHaveCount(0);
    return;
  }

  // Already archived — nothing to do (preserves idempotency)
  await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
  template = page.getByRole("listitem").filter({ hasText: description });
  if ((await template.count()) > 0) {
    return;
  }
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

/**
 * Navigates to /finances/scheduled and returns the template id for the given description.
 * Callers need not pre-navigate — this helper self-navigates. Avoid double navigation
 * by not calling gotoAndWaitForHydration before this helper.
 */
export async function getScheduledTemplateId(page: Page, description: string): Promise<string> {
  await gotoAndWaitForHydration(page, "/finances/scheduled");
  const item = page.getByRole("listitem").filter({ hasText: description });
  await expect(item).toHaveCount(1);

  const id = await item.evaluate((el) => el.getAttribute("data-template-id"));
  if (!id) {
    throw new Error(`Could not find the id for scheduled template: ${description}`);
  }
  return id;
}

export async function openScheduledTemplateForEdit(page: Page, id: string) {
  await gotoAndWaitForHydration(page, `/finances/scheduled/${id}`);
  await expect(page.getByTestId("description-input")).toBeVisible();
}

export async function archiveScheduledTemplateFromDetail(page: Page, id: string) {
  await openScheduledTemplateForEdit(page, id);
  const archiveButton = page.getByRole("button", { name: "Archive Schedule" });
  // Archived templates hide the button — only archive when visible
  if ((await archiveButton.count()) === 0) {
    return;
  }
  await archiveButton.click();
  const confirm = page.getByRole("button", { name: "Archive", exact: true });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await page.waitForURL(/\/finances\/scheduled$/, { timeout: 30000 });
}

export async function getArchivedTemplateId(page: Page, description: string): Promise<string> {
  await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
  const item = page.getByRole("listitem").filter({ hasText: description });
  await expect(item).toHaveCount(1);
  const id = await item.evaluate((el) => el.getAttribute("data-template-id"));
  if (!id) {
    throw new Error(`Could not find the id for archived template: ${description}`);
  }
  return id;
}

export async function getArchivedCount(page: Page): Promise<number> {
  await gotoAndWaitForHydration(page, "/finances/scheduled");
  const archivedLink = page.getByRole("link", { name: /Archived/ });
  const text = await archivedLink.textContent();
  const match = text?.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function openNewScheduledPage(page: Page) {
  await gotoAndWaitForHydration(page, "/finances/scheduled");
  await page.getByRole("link", { name: "New schedule" }).click();
  await page.waitForURL(/\/finances\/scheduled\/new/, { timeout: 30000 });
  await expect(page.getByTestId("description-input")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Schedule" })).toBeVisible();
}

type StandaloneScheduleOptions = {
  amount?: number;
  type?: "expense" | "income";
  category?: string | null;
  dayOfMonth?: number;
  endType?: "none" | "date" | "count";
  endDate?: Date;
  maxOccurrences?: number;
};

export async function createStandaloneScheduledTemplate(
  page: Page,
  description: string,
  options: StandaloneScheduleOptions = {},
): Promise<void> {
  await gotoAndWaitForHydration(page, "/finances/scheduled/new");
  await expect(page.getByTestId("description-input")).toBeVisible();

  await page.getByTestId("description-input").fill(description);

  const amount = options.amount ?? 75;
  await page.getByLabel("Amount").fill(String(amount));

  const type = options.type ?? "expense";
  if (type === "income") {
    await page.getByTestId("income-radio-item").click();
  } else {
    await page.getByTestId("expense-radio-item").click();
    if (options.category) {
      await page.getByRole("radio", { name: options.category }).click();
    }
  }

  if (options.dayOfMonth !== undefined) {
    const dayInput = page.getByLabel("Day of month");
    await dayInput.fill(String(options.dayOfMonth));
  }

  // Start date defaults to today; optionally override if provided
  if (options.endType === "date" && options.endDate) {
    await page.getByText("On date", { exact: true }).click();
    const endDatePicker = page.getByRole("button", { name: "End date" });
    await endDatePicker.click();
    const calendar = page.getByRole("dialog");
    await expect(calendar).toBeVisible();
    const targetName = format(options.endDate, "EEEE, MMMM d, yyyy");
    // Calendar may be on current month; loop next until target date appears (supports multi-month ahead)
    for (let attempt = 0; attempt < 12; attempt++) {
      const cell = calendar.getByRole("gridcell", { name: targetName, exact: true });
      if ((await cell.count()) > 0) {
        await cell.click();
        break;
      }
      await calendar.locator('button[slot="next"]').click();
      await expect(calendar).toBeVisible();
      // If last attempt still not found, throw to surface error
      if (attempt === 11) {
        throw new Error(`Could not find calendar cell for ${targetName}`);
      }
    }
    await expect(endDatePicker).toContainText(format(options.endDate, "PPP"));
  } else if (options.endType === "count" && options.maxOccurrences) {
    await page.getByText("After N occurrences", { exact: true }).click();
    await page.getByLabel("Number of occurrences").fill(String(options.maxOccurrences));
  } else if (options.endType === "none") {
    await page.getByText("Never", { exact: true }).click();
  }

  const createButton = page.getByRole("button", { name: "Create Schedule" });
  await createButton.click();
  await page.waitForURL(/\/finances\/scheduled$/, { timeout: 30000 });
  const template = page.getByRole("listitem").filter({ hasText: description });
  await expect(template).toBeVisible({ timeout: 15000 });
}

export async function getStandaloneTemplateId(page: Page, description: string): Promise<string> {
  return getScheduledTemplateId(page, description);
}
