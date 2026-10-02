import { expect, test, type Page } from "@playwright/test";
import { addMonths, format } from "date-fns";

import { gotoAndWaitForHydration } from "../helpers/auth";
import {
  createScheduledTransactionFixture,
  createTransactionFixture,
  deleteFixtures,
} from "../helpers/fixtures";
import {
  archiveScheduledTransactionTemplate,
  createScheduledTransaction,
  createTransaction,
  deleteTransaction,
  getArchivedTemplateId,
  getTransactionId,
  openScheduledTemplateForEdit,
  openTransactionComposer,
  openTransactionForEdit,
} from "../helpers/transactions";

const descriptionField = (page: Page) => page.getByTestId("description-input");

test.describe.configure({ timeout: 60000 });

// Tests run in parallel, so rows saved here use descriptions the composer tests never type;
// otherwise their exact-text assertions on "Milk 75"/"Bread 40" would match a saved table row.
test.describe("transaction mutations", () => {
  test("AI parse then save creates a transaction", async ({ page }) => {
    const description = "Milk 75 saved";

    try {
      await gotoAndWaitForHydration(page, "/finances/transactions");

      const id = await createTransaction(page, "Milk 75", description);
      await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("new transaction form reflects type and category", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await input.fill("Milk 75");
    await input.press("Enter");
    await expect(page.getByText("1 entry queued")).toBeVisible();
    await page.getByTestId("parse-transaction").click();
    await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });

    const categoryField = page.getByText("Category", { exact: true });
    const foodToggle = page.getByRole("radio", { name: "Food & Drinks" });

    await expect(categoryField).toBeVisible();

    // AI may pre-select Food & Drinks for "Milk 75" — only click when unselected
    // to avoid toggling an already-selected value off (ToggleGroup allows deselect).
    if ((await foodToggle.getAttribute("aria-checked")) !== "true") {
      await foodToggle.click();
    }
    await expect(foodToggle).toHaveAttribute("aria-checked", "true");

    await page.getByTestId("income-radio-item").click();
    await expect(categoryField).toHaveCount(0);

    await page.getByTestId("expense-radio-item").click();
    await expect(categoryField).toBeVisible();
  });

  test("updating a transaction persists the changes", async ({ page }) => {
    const description = "Bread loaf";
    const updated = "Bread loaf edited";

    try {
      const id = await createTransactionFixture(page, description);
      await openTransactionForEdit(page, id);
      await descriptionField(page).fill(updated);

      const saveButton = page.getByRole("button", { name: "Save Changes" });
      await saveButton.click();
      await expect(saveButton).toBeDisabled();
      await expect(saveButton).toBeEnabled();

      await gotoAndWaitForHydration(page, `/finances/transactions/${id}`);
      await expect(descriptionField(page)).toHaveValue(updated);
    } finally {
      await deleteFixtures(page, description, updated);
    }
  });

  test("deleting a transaction removes it from the list", async ({ page }) => {
    const description = "Soda 30";

    try {
      const id = await createTransactionFixture(page, description);
      await deleteTransaction(page, id);
      await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toHaveCount(0);
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("delete confirmation dialog opens and Cancel dismisses it", async ({ page }) => {
    const description = "Tea 20";

    try {
      const id = await createTransactionFixture(page, description);
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
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("parsing from the dashboard creates a transaction and returns to the dashboard", async ({
    page,
  }) => {
    const description = "Coffee beans";

    try {
      await gotoAndWaitForHydration(page, "/finances");
      await openTransactionComposer(page);

      const input = page.getByPlaceholder("Add transaction...");
      await input.fill(`${description} 55`);
      await input.press("Enter");
      await expect(page.getByText("1 entry queued")).toBeVisible();
      await page.getByTestId("parse-transaction").click();
      await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });
      await descriptionField(page).fill(description);

      await page.getByRole("button", { name: "Save Transaction" }).click();
      await page.waitForURL(/\/finances(\/?$|\?)/, { timeout: 30000 });

      const id = await getTransactionId(page, description);
      await expect(page.locator(`tr[data-transaction-id="${id}"]`)).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("scheduling a new transaction creates a visible template", async ({ page }) => {
    const description = "Monthly gym membership";
    await gotoAndWaitForHydration(page, "/finances");

    try {
      await createScheduledTransaction(page, description);
      await page.getByRole("link", { name: "Manage scheduled transactions" }).click();
      await expect(page).toHaveURL(/\/finances\/scheduled$/);

      const template = page.getByRole("listitem").filter({ hasText: description });
      await expect(template).toBeVisible();
      await expect(template.getByText("1/3 occurrences")).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("scheduling a new transaction with no end condition shows No end", async ({ page }) => {
    const description = "Cloud storage subscription";
    await gotoAndWaitForHydration(page, "/finances");

    try {
      await createScheduledTransaction(page, description, { endType: "none" });
      await gotoAndWaitForHydration(page, "/finances/scheduled");

      const template = page.getByRole("listitem").filter({ hasText: description });
      await expect(template).toBeVisible();
      await expect(template.getByText("No end", { exact: true })).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test.describe("date-based scheduling", () => {
    test("scheduling a new transaction until a date shows the end date", async ({ page }) => {
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
        await createScheduledTransaction(page, description, { endType: "date", endDate });
        await gotoAndWaitForHydration(page, "/finances/scheduled");

        const template = page.getByRole("listitem").filter({ hasText: description });
        await expect(template).toBeVisible();
        await expect(
          template.getByText(`Until ${format(endDate, "MMM d, yyyy")}`, { exact: true }),
        ).toBeVisible();
      } finally {
        await deleteFixtures(page, description);
      }
    });
  });

  test("an existing transaction can be made recurring and paused", async ({ page }) => {
    const description = "Netflix subscription";

    try {
      const id = await createTransactionFixture(page, description);
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
      await deleteFixtures(page, description);
    }
  });

  test("archiving a scheduled template preserves its linked transaction and moves to archived", async ({
    page,
  }) => {
    const description = "Magazine subscription";

    try {
      const { transactionId } = await createScheduledTransactionFixture(page, description, {
        schedule: { maxOccurrences: 3 },
      });
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
      await openTransactionForEdit(page, transactionId);
      await expect(page.getByTestId("description-input")).toHaveValue(description);
    } finally {
      await deleteFixtures(page, description);
    }
  });
});

test.describe("scheduled template editing", () => {
  test("clicking a scheduled row navigates to the edit page", async ({ page }) => {
    const description = "Edit navigation test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page).toHaveURL(new RegExp(`/finances/scheduled/${templateId}`));
      await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("edit form loads with correct default values", async ({ page }) => {
    const description = "Default values test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description, {
        schedule: { maxOccurrences: 5 },
      });

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByTestId("description-input")).toHaveValue(description);
      await expect(page.getByTestId("expense-radio-item")).toHaveAttribute("data-selected", "true");
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("editing a scheduled transaction persists changes", async ({ page }) => {
    const description = "Persist edit test";
    const updated = "Persist edit updated";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await page.getByTestId("description-input").fill(updated);

      const saveButton = page.getByRole("button", { name: "Save Changes" });
      await saveButton.click();
      await expect(saveButton).toBeDisabled();
      await expect(saveButton).toBeEnabled();

      await gotoAndWaitForHydration(page, `/finances/scheduled/${templateId}`);
      await expect(page.getByTestId("description-input")).toHaveValue(updated);
    } finally {
      await deleteFixtures(page, description, updated);
    }
  });

  test("cancel on edit page navigates back to scheduled list", async ({ page }) => {
    const description = "Cancel navigation test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/finances\/scheduled$/);
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("archive from edit page with confirmation", async ({ page }) => {
    const description = "Archive from edit test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description);

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
      await deleteFixtures(page, description);
    }
  });

  test("archive confirmation Cancel dismisses dialog", async ({ page }) => {
    const description = "Archive cancel test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description);

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
      await deleteFixtures(page, description);
    }
  });

  test("summary card shows scheduled badge and occurrence count", async ({ page }) => {
    const description = "Summary card test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description, {
        schedule: { maxOccurrences: 3 },
      });

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByText("Scheduled", { exact: true })).toBeVisible();
      await expect(page.getByText("1/3 occurrences")).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("summary card shows paused badge for inactive template", async ({ page }) => {
    const description = "Paused badge test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description);

      await gotoAndWaitForHydration(page, "/finances/scheduled");
      const template = page.getByRole("listitem").filter({ hasText: description });
      await template.getByRole("button", { name: "Pause" }).click();
      await expect(template.getByRole("button", { name: "Resume" })).toBeVisible();

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByText("Paused", { exact: true })).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });

  test("income type hides category field on edit form", async ({ page }) => {
    const description = "Income category test";

    try {
      const { templateId } = await createScheduledTransactionFixture(page, description);

      await openScheduledTemplateForEdit(page, templateId);
      await expect(page.getByText("Category", { exact: true })).toBeVisible();

      await page.getByTestId("income-radio-item").click();
      await expect(page.getByText("Category", { exact: true })).toHaveCount(0);

      await page.getByTestId("expense-radio-item").click();
      await expect(page.getByText("Category", { exact: true })).toBeVisible();
    } finally {
      await deleteFixtures(page, description);
    }
  });
});

test.describe("transaction input queue", () => {
  test("queuing an entry via Enter shows a badge and enables save", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await expect(page.getByTestId("parse-transaction")).toBeDisabled();

    await input.fill("Milk 75");
    await input.press("Enter");

    await expect(page.getByText("1 entry queued")).toBeVisible();
    await expect(page.getByText("Milk 75", { exact: true })).toBeVisible();
    await expect(page.getByText(/press \+ to save/i)).toBeVisible();
    await expect(page.getByTestId("parse-transaction")).toBeEnabled();
  });

  test("typing without queuing enables save for a single entry", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await expect(page.getByTestId("parse-transaction")).toBeDisabled();
    await expect(page.getByText("Press Enter to queue entries, + to save")).toBeVisible();

    await input.fill("Milk 75");
    // No Enter pressed — save is enabled directly from the draft.
    await expect(page.getByText(/queued/)).toHaveCount(0);
    await expect(page.getByTestId("parse-transaction")).toBeEnabled();
    await page.getByTestId("parse-transaction").click();
    await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });
  });

  test("save combines a queued entry with the current draft", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await input.fill("Milk 75");
    await input.press("Enter");
    await expect(page.getByText("1 entry queued")).toBeVisible();

    await input.fill("Bread 40");
    await page.getByTestId("parse-transaction").click();
    await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });
    await expect(page.getByTestId("description-input")).toHaveCount(2);
  });

  test("X removes a queued entry and disables save", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await input.fill("Bread 40");
    await input.press("Enter");

    await expect(page.getByText("1 entry queued")).toBeVisible();
    await page.getByRole("button", { name: "Remove entry 1" }).click();
    await expect(page.getByText("Bread 40", { exact: true })).toHaveCount(0);
    await expect(page.getByTestId("parse-transaction")).toBeDisabled();
  });

  test("Backspace on an empty input removes the last queued entry", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await input.fill("Milk 75");
    await input.press("Enter");
    await expect(page.getByText("1 entry queued")).toBeVisible();

    await input.press("Backspace");
    await expect(page.getByText("Milk 75", { exact: true })).toHaveCount(0);
    await expect(page.getByTestId("parse-transaction")).toBeDisabled();
  });

  test("Backspace on a fully empty input closes the composer", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await input.press("Backspace");
    await expect(input).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add transaction" })).toBeFocused();
  });

  test("Backspace with queued entries removes the last one without closing", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await input.fill("Milk 75");
    await input.press("Enter");
    await expect(page.getByText("1 entry queued")).toBeVisible();

    await input.press("Backspace");
    await expect(page.getByText("Milk 75", { exact: true })).toHaveCount(0);
    await expect(input).toBeVisible();
  });

  test("Enter on an empty input saves queued entries", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    const input = page.getByPlaceholder("Add transaction...");
    await input.fill("Milk 75");
    await input.press("Enter");
    await expect(page.getByText("1 entry queued")).toBeVisible();

    await input.press("Enter");
    await page.waitForURL(/\/finances\/transactions\/new/, { timeout: 30000 });
  });

  test("pasting multi-line text splits into multiple queued entries", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/transactions");
    await openTransactionComposer(page);

    await page.evaluate((text) => {
      const input = document.querySelector('input[placeholder="Add transaction..."]');
      if (!input) {
        throw new Error("Transaction input not found");
      }
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/plain", text);
      input.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, "Milk 75\nBread 40");

    await expect(page.getByText("2 entries queued")).toBeVisible();
    await expect(page.getByText("Milk 75", { exact: true })).toBeVisible();
    await expect(page.getByText("Bread 40", { exact: true })).toBeVisible();
    await expect(page.getByTestId("parse-transaction")).toBeEnabled();
  });
});
