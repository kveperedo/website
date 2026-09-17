import { expect, test, type Page } from "@playwright/test";
import { addMonths, format } from "date-fns";

import { gotoAndWaitForHydration } from "../helpers/auth";
import {
  archiveScheduledTransactionTemplate,
  createScheduledTransaction,
  createTransaction,
  deleteTransaction,
  deleteTransactionByDescription,
  getArchivedTemplateId,
  getScheduledTemplateId,
  getTransactionId,
  openScheduledTemplateForEdit,
  openTransactionComposer,
  openTransactionForEdit,
} from "../helpers/transactions";

const descriptionField = (page: Page) => page.getByTestId("description-input");

test.describe.configure({ mode: "serial", timeout: 60000 });

test.describe("transaction mutations", () => {
  test("AI parse then save creates a transaction", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");

    const id = await createTransaction(page, "Milk 75");
    await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toBeVisible();
    await deleteTransaction(page, id);
  });

  test("new transaction form reflects type and category", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
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

    await gotoAndWaitForHydration(page, `/finances/transactions/${id}`);
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

    await page
      .getByLabel("Delete this transaction?")
      .getByRole("button", { name: "Cancel" })
      .click();
    await expect(page.getByText("Delete this transaction?")).toHaveCount(0);

    await expect(page).toHaveURL(new RegExp(`/finances/transactions/${id}`));
    await expect(page.getByRole("button", { name: "Delete Transaction" })).toBeVisible();
    await deleteTransaction(page, id);
  });

  test("parsing from the dashboard creates a transaction and returns to the dashboard", async ({
    page,
  }) => {
    const description = "Coffee beans";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      await openTransactionComposer(page);

      const input = page.getByPlaceholder("Add transaction...");
      await input.fill(`${description} 55`);
      await page.getByTestId("parse-transaction").click();
      await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });
      await descriptionField(page).fill(description);

      await page.getByRole("button", { name: "Save Transaction" }).click();
      await page.waitForURL(/\/finances(\/?$|\?)/, { timeout: 30000 });

      id = await getTransactionId(page, description);
      await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toBeVisible();
    } finally {
      if (id) {
        await deleteTransaction(page, id);
      } else {
        await deleteTransactionByDescription(page, description);
      }
    }
  });

  test("scheduling a new transaction creates a visible template", async ({ page }) => {
    const description = "Monthly gym membership";
    let id: string | undefined;
    await gotoAndWaitForHydration(page, "/finances");

    try {
      id = await createScheduledTransaction(page, description);
      await page.getByRole("link", { name: "Manage scheduled transactions" }).click();
      await expect(page).toHaveURL(/\/finances\/scheduled$/);

      const template = page.getByRole("listitem").filter({ hasText: description });
      await expect(template).toBeVisible();
      await expect(template.getByText("1/3 occurrences")).toBeVisible();
    } finally {
      try {
        await archiveScheduledTransactionTemplate(page, description);
      } finally {
        if (id) {
          await deleteTransaction(page, id);
        } else {
          await deleteTransactionByDescription(page, description);
        }
      }
    }
  });

  test("scheduling a new transaction with no end condition shows No end", async ({ page }) => {
    const description = "Cloud storage subscription";
    let id: string | undefined;
    await gotoAndWaitForHydration(page, "/finances");

    try {
      id = await createScheduledTransaction(page, description, { endType: "none" });
      await gotoAndWaitForHydration(page, "/finances/scheduled");

      const template = page.getByRole("listitem").filter({ hasText: description });
      await expect(template).toBeVisible();
      await expect(template.getByText("No end", { exact: true })).toBeVisible();
    } finally {
      try {
        await archiveScheduledTransactionTemplate(page, description);
      } finally {
        if (id) {
          await deleteTransaction(page, id);
        } else {
          await deleteTransactionByDescription(page, description);
        }
      }
    }
  });

  test.describe("date-based scheduling", () => {
    test("scheduling a new transaction until a date shows the end date", async ({ page }) => {
      let id: string | undefined;
      await gotoAndWaitForHydration(page, "/finances");
      const browserToday = await page.evaluate(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
      });
      const endDate = addMonths(
        new Date(browserToday.year, browserToday.month, browserToday.day),
        1,
      );
      const description = `Vacation savings through ${format(endDate, "MMMM yyyy")}`;

      try {
        id = await createScheduledTransaction(page, description, { endType: "date", endDate });
        await gotoAndWaitForHydration(page, "/finances/scheduled");

        const template = page.getByRole("listitem").filter({ hasText: description });
        await expect(template).toBeVisible();
        await expect(
          template.getByText(`Until ${format(endDate, "MMM d, yyyy")}`, { exact: true }),
        ).toBeVisible();
      } finally {
        try {
          await archiveScheduledTransactionTemplate(page, description);
        } finally {
          if (id) {
            await deleteTransaction(page, id);
          } else {
            await deleteTransactionByDescription(page, description);
          }
        }
      }
    });
  });

  test("an existing transaction can be made recurring and paused", async ({ page }) => {
    const description = "Netflix subscription";
    let id: string | undefined;
    await gotoAndWaitForHydration(page, "/finances/transactions");

    try {
      id = await createTransaction(page, `${description} 75`, description);
      await openTransactionForEdit(page, id);

      await page.getByRole("button", { name: "Make recurring" }).click();
      await expect(page.getByRole("heading", { name: "Make recurring" })).toBeVisible();
      await page.getByRole("button", { name: "Create schedule" }).click();
      await expect(page.getByRole("heading", { name: "Make recurring" })).toHaveCount(0);

      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const template = page.getByRole("listitem").filter({ hasText: description });
      await expect(template).toBeVisible();
      await template.getByRole("button", { name: "Pause" }).click();
      await expect(template.getByRole("button", { name: "Resume" })).toBeVisible();

      await openTransactionForEdit(page, id);
      await expect(page.getByText("Paused", { exact: true })).toBeVisible();
    } finally {
      try {
        await archiveScheduledTransactionTemplate(page, description);
      } finally {
        if (id) {
          await deleteTransaction(page, id);
        } else {
          await deleteTransactionByDescription(page, description);
        }
      }
    }
  });

  test("archiving a scheduled template preserves its linked transaction and moves to archived", async ({
    page,
  }) => {
    const description = "Magazine subscription";
    let id: string | undefined;
    await gotoAndWaitForHydration(page, "/finances");

    try {
      id = await createScheduledTransaction(page, description);
      await archiveScheduledTransactionTemplate(page, description);
      // Removed from main list
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      await expect(page.getByRole("listitem").filter({ hasText: description })).toHaveCount(0);
      // Visible on archived page
      await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
      await expect(page.getByRole("listitem").filter({ hasText: description })).toBeVisible();
      // Verify via helper
      const archivedId = await getArchivedTemplateId(page, description);
      expect(archivedId).toBeTruthy();
      // Linked transaction still exists — ensure transaction still loads
      await openTransactionForEdit(page, id!);
      await expect(page.getByTestId("description-input")).toHaveValue(description);
    } finally {
      if (id) {
        await deleteTransaction(page, id);
      } else {
        await deleteTransactionByDescription(page, description);
      }
    }
  });
});

test.describe("scheduled template editing", () => {
  test("clicking a scheduled row navigates to the edit page", async ({ page }) => {
    const description = "Edit navigation test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description);
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page).toHaveURL(new RegExp(`/finances/scheduled/${templateId}`));
      await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });

  test("edit form loads with correct default values", async ({ page }) => {
    const description = "Default values test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description, {
        endType: "count",
        maxOccurrences: 5,
      });
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByTestId("description-input")).toHaveValue(description);
      await expect(page.getByTestId("expense-radio-item")).toHaveAttribute("data-selected", "true");
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });

  test("editing a scheduled transaction persists changes", async ({ page }) => {
    const description = "Persist edit test";
    const updated = "Persist edit updated";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description);
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await page.getByTestId("description-input").fill(updated);

      const saveButton = page.getByRole("button", { name: "Save Changes" });
      await saveButton.click();
      await expect(saveButton).toBeDisabled();
      await expect(saveButton).toBeEnabled();

      await gotoAndWaitForHydration(page, `/finances/scheduled/${templateId}`);
      await expect(page.getByTestId("description-input")).toHaveValue(updated);
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });

  test("cancel on edit page navigates back to scheduled list", async ({ page }) => {
    const description = "Cancel navigation test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description);
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/finances\/scheduled$/);
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });

  test("archive from edit page with confirmation", async ({ page }) => {
    const description = "Archive from edit test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description);
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await page.getByRole("button", { name: "Archive Schedule" }).click();
      await expect(page.getByText("Archive this scheduled transaction?")).toBeVisible();

      await page.getByRole("button", { name: "Archive", exact: true }).click();
      await page.waitForURL(/\/finances\/scheduled$/);

      await expect(page.getByRole("listitem").filter({ hasText: description })).toHaveCount(0);
      // Verify archived
      await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
      await expect(page.getByRole("listitem").filter({ hasText: description })).toBeVisible();
    } finally {
      if (id) {
        await deleteTransaction(page, id);
      }
    }
  });

  test("archive confirmation Cancel dismisses dialog", async ({ page }) => {
    const description = "Archive cancel test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description);
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await page.getByRole("button", { name: "Archive Schedule" }).click();
      await page.getByText("Archive this scheduled transaction?").waitFor();
      await page
        .getByLabel("Archive this scheduled")
        .getByRole("button", { name: "Cancel" })
        .click();
      await expect(page.getByText("Archive this scheduled transaction?")).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`/finances/scheduled/${templateId}`));
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });

  test("summary card shows scheduled badge and occurrence count", async ({ page }) => {
    const description = "Summary card test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description, {
        endType: "count",
        maxOccurrences: 3,
      });
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByText("Scheduled", { exact: true })).toBeVisible();
      await expect(page.getByText("1/3 occurrences")).toBeVisible();
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });

  test("summary card shows paused badge for inactive template", async ({ page }) => {
    const description = "Paused badge test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description);

      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const template = page.getByRole("listitem").filter({ hasText: description });
      await template.getByRole("button", { name: "Pause" }).click();
      await expect(template.getByRole("button", { name: "Resume" })).toBeVisible();

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByText("Paused", { exact: true })).toBeVisible();
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });

  test("income type hides category field on edit form", async ({ page }) => {
    const description = "Income category test";
    let id: string | undefined;

    try {
      await gotoAndWaitForHydration(page, "/finances");
      id = await createScheduledTransaction(page, description);
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const templateId = await getScheduledTemplateId(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByText("Category", { exact: true })).toBeVisible();

      await page.getByTestId("income-radio-item").click();
      await expect(page.getByText("Category", { exact: true })).toHaveCount(0);

      await page.getByTestId("expense-radio-item").click();
      await expect(page.getByText("Category", { exact: true })).toBeVisible();
    } finally {
      if (id) {
        await archiveScheduledTransactionTemplate(page, description);
        await deleteTransaction(page, id);
      }
    }
  });
});
