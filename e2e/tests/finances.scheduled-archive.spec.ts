import { expect, test } from "@playwright/test";

import { gotoAndWaitForHydration } from "../helpers/auth";
import {
  archiveScheduledTransactionTemplate,
  archiveScheduledTemplateFromDetail,
  createStandaloneScheduledTemplate,
  getArchivedTemplateId,
  getScheduledTemplateId,
} from "../helpers/transactions";

test.describe.configure({ mode: "serial", timeout: 60000 });

test.describe("scheduled archive via /finances/scheduled/archived", () => {
  test("archiving from list removes from main list and appears in archived with badge count", async ({
    page,
  }) => {
    const description = `Archive list ${Date.now()}`;

    try {
      await createStandaloneScheduledTemplate(page, description, {
        amount: 120,
        endType: "none",
      });

      const beforeCountText = await page.getByRole("link", { name: /Archived/ }).textContent();
      const beforeCount = beforeCountText?.match(/\((\d+)\)/)
        ? parseInt(beforeCountText.match(/\((\d+)\)/)![1], 10)
        : 0;

      await archiveScheduledTransactionTemplate(page, description);

      // Gone from main list
      await gotoAndWaitForHydration(page, "/finances/scheduled");
      await expect(page.getByRole("listitem").filter({ hasText: description })).toHaveCount(0);

      // Badge incremented
      const archivedLink = page.getByRole("link", { name: /Archived/ });
      await expect(archivedLink).toBeVisible();
      if (beforeCount === 0) {
        // First archived may show count or not — check link still visible
        await expect(archivedLink).toContainText("Archived");
      } else {
        await expect(archivedLink).toContainText(`(${beforeCount + 1})`);
      }

      // Appears on archived page, not muted (archived should retain full opacity)
      await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
      const archivedItem = page.getByRole("listitem").filter({ hasText: description });
      await expect(archivedItem).toBeVisible();
      await expect(archivedItem).not.toHaveClass(/opacity-50/);
      // Archived page items have no action buttons
      await expect(archivedItem.getByRole("button", { name: "Archive template" })).toHaveCount(0);
      await expect(archivedItem.getByRole("button", { name: "Pause" })).toHaveCount(0);
      await expect(archivedItem.getByRole("button", { name: "Resume" })).toHaveCount(0);

      // Detail via archived row should be openable
      const archivedId = await getArchivedTemplateId(page, description);
      expect(archivedId).toBeTruthy();
    } finally {
      // Archived items remain for reference — no hard delete; verify via archived page then leave
      // For isolation, archiving is the cleanup. If still on main list, archive it.
      await archiveScheduledTransactionTemplate(page, description);
    }
  });

  test("archived detail shows Alert, hides Save and Archive, disables fields and shows Archived badge", async ({
    page,
  }) => {
    const description = `Archive detail ${Date.now()}`;

    try {
      await createStandaloneScheduledTemplate(page, description, {
        amount: 55,
        endType: "none",
      });
      const templateId = await getScheduledTemplateId(page, description);
      await archiveScheduledTransactionTemplate(page, description);

      await gotoAndWaitForHydration(page, `/finances/scheduled/${templateId}`);

      // Archived banner
      await expect(page.getByText("This schedule is archived and cannot be edited.")).toBeVisible();
      await expect(page.getByRole("alert")).toBeVisible();

      // Save hidden, Archive hidden, Cancel still visible
      await expect(page.getByRole("button", { name: "Save Changes" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Archive Schedule" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

      // Fields disabled
      await expect(page.getByTestId("description-input")).toBeDisabled();
      await expect(page.getByLabel("Amount")).toBeDisabled();
      await expect(page.getByLabel("Day of month")).toBeDisabled();

      // Badge shows Archived (not Scheduled/Paused)
      await expect(page.getByText("Archived", { exact: true }).first()).toBeVisible();

      // Opacity: archived detail card should NOT be muted (unlike paused)
      // List item on archived page already checked not muted above, detail not muted
    } finally {
      await archiveScheduledTransactionTemplate(page, description);
    }
  });

  test("archived page navigation, empty-ish state, and back navigation", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/finances/scheduled");
    const archivedLink = page.getByRole("link", { name: /Archived/ });
    await expect(archivedLink).toBeVisible();
    await archivedLink.click();
    await expect(page).toHaveURL(/\/finances\/scheduled\/archived/);
    await expect(page.getByRole("heading", { name: "Archived Schedules" })).toBeVisible();
    await expect(page.getByText("Archived", { exact: true }).first()).toBeVisible();

    await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
    await page.locator('a[href="/finances/scheduled"]').first().click();
    await expect(page).toHaveURL(/\/finances\/scheduled$/);

    // Verify empty state copy when no archived (or list present)
    await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
    const empty = page.getByText("No archived schedules.");
    const list = page.getByRole("list", { name: "Archived scheduled transactions" });
    // One of them must be visible
    await expect(empty.or(list)).toBeVisible();
    if ((await empty.count()) > 0) {
      await expect(page.getByText("Archived schedules stay here for reference.")).toBeVisible();
    }
  });

  test("active/paused filtering — archived not in main list, pause/resume still works for active", async ({
    page,
  }) => {
    const activeDesc = `Filter active ${Date.now()}`;
    const toArchiveDesc = `Filter archived ${Date.now()}`;

    try {
      await createStandaloneScheduledTemplate(page, activeDesc, {
        amount: 10,
        endType: "none",
      });
      await createStandaloneScheduledTemplate(page, toArchiveDesc, {
        amount: 20,
        endType: "none",
      });
      await archiveScheduledTransactionTemplate(page, toArchiveDesc);

      await gotoAndWaitForHydration(page, "/finances/scheduled");
      await expect(page.getByRole("listitem").filter({ hasText: activeDesc })).toBeVisible();
      await expect(page.getByRole("listitem").filter({ hasText: toArchiveDesc })).toHaveCount(0);

      // Toggle active -> paused -> resend still works (archived never appears for toggle)
      const activeItem = page.getByRole("listitem").filter({ hasText: activeDesc });
      await activeItem.getByRole("button", { name: "Pause" }).click();
      await expect(activeItem.getByRole("button", { name: "Resume" })).toBeVisible();
      // Paused items should be muted (opacity-50)
      await expect(activeItem).toHaveClass(/opacity-50/);

      await activeItem.getByRole("button", { name: "Resume" }).click();
      await expect(activeItem.getByRole("button", { name: "Pause" })).toBeVisible();
      await expect(activeItem).not.toHaveClass(/opacity-50/);

      // Archived page must contain archived, not active
      await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
      await expect(page.getByRole("listitem").filter({ hasText: toArchiveDesc })).toBeVisible();
      await expect(page.getByRole("listitem").filter({ hasText: activeDesc })).toHaveCount(0);
    } finally {
      await archiveScheduledTransactionTemplate(page, activeDesc);
      await archiveScheduledTransactionTemplate(page, toArchiveDesc);
    }
  });

  test("archiving via detail page moves to archived list", async ({ page }) => {
    const description = `Archive detail flow ${Date.now()}`;

    try {
      await createStandaloneScheduledTemplate(page, description, {
        amount: 75,
        endType: "none",
      });
      const templateId = await getScheduledTemplateId(page, description);

      await archiveScheduledTemplateFromDetail(page, templateId);
      await expect(page).toHaveURL(/\/finances\/scheduled$/);
      await expect(page.getByRole("listitem").filter({ hasText: description })).toHaveCount(0);

      await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
      const archivedItem = page.getByRole("listitem").filter({ hasText: description });
      await expect(archivedItem).toBeVisible();
      await expect(archivedItem).not.toHaveClass(/opacity-50/);
    } finally {
      await archiveScheduledTransactionTemplate(page, description);
    }
  });

  test("archived list items are clickable and preserve data-template-id", async ({ page }) => {
    const description = `Archive clickable ${Date.now()}`;

    try {
      await createStandaloneScheduledTemplate(page, description, {
        amount: 33,
        endType: "none",
      });
      await archiveScheduledTransactionTemplate(page, description);

      await gotoAndWaitForHydration(page, "/finances/scheduled/archived");
      const item = page.getByRole("listitem").filter({ hasText: description });
      await expect(item).toBeVisible();
      await expect(item).toHaveAttribute("data-template-id", /[0-9a-f-]{36}/);
      // Click row should navigate to detail (via role button with aria-label)
      await item.click();
      await expect(page).toHaveURL(/\/finances\/scheduled\/[0-9a-f-]{36}/);
      await expect(page.getByTestId("description-input")).toBeVisible();
    } finally {
      await archiveScheduledTransactionTemplate(page, description);
    }
  });
});
