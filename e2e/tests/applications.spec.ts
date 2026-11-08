import { expect, test } from "@playwright/test";

import {
  addApplication,
  applicationCard,
  changeApplicationStatus,
  createApplication,
  deleteApplicationFixtures,
  deleteApplicationFromBoard,
  deleteApplicationFromDetail,
  gotoApplications,
  openApplicationDetail,
  openApplicationForm,
} from "../helpers/applications";
import { gotoAndWaitForHydration, waitForHydration } from "../helpers/auth";

const DATE_TEXT = /^\d{2}\/\d{2}\/\d{4}$/;

let sequence = 0;

/** Companies created by these tests are unique so parallel runs and cleanup never overlap. */
const uniqueCompany = (label: string) => `E2E ${label} ${Date.now()}-${sequence++}`;

test.describe.configure({ timeout: 60000 });

test.describe("applications", () => {
  test("validates the form before creating an application", async ({ page }) => {
    await gotoApplications(page);
    const form = await openApplicationForm(page);

    await page.getByRole("button", { name: "Add application" }).click();

    await expect(form.getByText("Enter a position.")).toBeVisible();
    await expect(form.getByText("Enter a company.")).toBeVisible();
    await expect(form.getByText("Enter a valid http or https link.")).toBeVisible();

    await form.getByLabel("Position").fill("Product Engineer");
    await form.getByLabel("Company").fill("Acme");
    await form.getByLabel("Job listing link").fill("not-a-url");
    await page.getByRole("button", { name: "Add application" }).click();

    await expect(form.getByText("Enter a valid http or https link.")).toBeVisible();
  });

  test("creates a saved application and shows it on the board", async ({ page }) => {
    const company = uniqueCompany("Create");
    const position = "Senior Frontend Engineer";
    const link = "https://example.com/jobs/e2e-create";
    const notes = "Created by the E2E suite.";

    try {
      await createApplication(page, { position, company, link, notes });

      const card = applicationCard(page, company);
      await expect(card).toHaveAttribute("data-status", "saved");
      await expect(card.getByText(position)).toBeVisible();
      await expect(card.getByText(notes)).toBeVisible();
      await expect(card.getByText(DATE_TEXT)).toHaveCount(0);
      await expect(
        card.getByRole("link", { name: `Open ${position} at ${company} in a new tab` }),
      ).toHaveAttribute("href", link);

      const form = page.locator("form:visible");
      await expect(form.getByLabel("Position")).toHaveValue("");
      await expect(form.getByLabel("Company")).toHaveValue("");
      await expect(form.getByLabel("Job listing link")).toHaveValue("");
      await expect(form.getByLabel("Notes")).toHaveValue("");

      await page.reload();
      await waitForHydration(page);

      await expect(applicationCard(page, company)).toHaveAttribute("data-status", "saved");
    } finally {
      await deleteApplicationFixtures(page, company);
    }
  });

  test("filters each lane independently by company or position", async ({ page }) => {
    const savedCompany = uniqueCompany("Search Alpha");
    const otherSavedCompany = uniqueCompany("Search Beta");
    const appliedCompany = uniqueCompany("Search Applied");
    const sharedPosition = "Platform Reliability Engineer";

    try {
      await gotoApplications(page);
      await addApplication(page, { position: sharedPosition, company: savedCompany });
      await addApplication(page, { position: "Product Designer", company: otherSavedCompany });
      await addApplication(page, { position: sharedPosition, company: appliedCompany });
      await changeApplicationStatus(page, appliedCompany, "applied");

      const savedSearch = page.getByLabel("Search Saved applications");

      await savedSearch.fill(savedCompany);
      await expect(applicationCard(page, savedCompany)).toBeVisible();
      await expect(applicationCard(page, otherSavedCompany)).toHaveCount(0);
      await expect(applicationCard(page, appliedCompany)).toBeVisible();

      await savedSearch.fill(sharedPosition);
      await expect(applicationCard(page, savedCompany)).toBeVisible();
      await expect(applicationCard(page, otherSavedCompany)).toHaveCount(0);

      await savedSearch.fill("no-such-application");
      await expect(page.getByText("No matches")).toBeVisible();
      await expect(applicationCard(page, appliedCompany)).toBeVisible();

      await page.getByRole("button", { name: "Clear search" }).click();
      await expect(applicationCard(page, otherSavedCompany)).toBeVisible();
    } finally {
      await deleteApplicationFixtures(page, savedCompany, otherSavedCompany, appliedCompany);
    }
  });

  test("moves an application between Saved and Applied with its applied date", async ({ page }) => {
    const company = uniqueCompany("Status");

    try {
      await createApplication(page, { position: "Backend Engineer", company });

      const savedCard = applicationCard(page, company);
      await expect(savedCard).toHaveAttribute("data-status", "saved");
      await expect(savedCard.getByText(DATE_TEXT)).toHaveCount(0);

      await changeApplicationStatus(page, company, "applied");

      const appliedCard = applicationCard(page, company);
      await expect(appliedCard).toHaveAttribute("data-status", "applied");
      await expect(appliedCard.getByText(DATE_TEXT)).toBeVisible();

      await page.reload();
      await waitForHydration(page);

      const persistedCard = applicationCard(page, company);
      await expect(persistedCard).toHaveAttribute("data-status", "applied");
      await expect(persistedCard.getByText(DATE_TEXT)).toBeVisible();

      await changeApplicationStatus(page, company, "saved");

      const revertedCard = applicationCard(page, company);
      await expect(revertedCard).toHaveAttribute("data-status", "saved");
      await expect(revertedCard.getByText(DATE_TEXT)).toHaveCount(0);

      await page.reload();
      await waitForHydration(page);

      await expect(applicationCard(page, company)).toHaveAttribute("data-status", "saved");
      await expect(applicationCard(page, company).getByText(DATE_TEXT)).toHaveCount(0);
    } finally {
      await deleteApplicationFixtures(page, company);
    }
  });

  test("hides an application moved to a terminal status", async ({ page }) => {
    const company = uniqueCompany("Terminal");

    try {
      await createApplication(page, { position: "Engineering Manager", company });

      await changeApplicationStatus(page, company, "offer");
      await expect(applicationCard(page, company)).toHaveCount(0);

      await page.reload();
      await waitForHydration(page);

      await expect(applicationCard(page, company)).toHaveCount(0);
    } finally {
      await deleteApplicationFixtures(page, company);
    }
  });

  test("edits an application from the detail page", async ({ page }) => {
    const originalCompany = uniqueCompany("Detail");
    const updatedCompany = uniqueCompany("Detail Updated");
    const originalPosition = "Data Engineer";
    const updatedPosition = "Staff Data Engineer";
    const updatedNotes = "Updated from the detail page.";

    try {
      await createApplication(page, { position: originalPosition, company: originalCompany });
      await openApplicationDetail(page, originalCompany);

      await expect(page.getByRole("heading", { name: originalPosition, level: 1 })).toBeVisible();

      await page.getByLabel("Position").fill(updatedPosition);
      await page.getByLabel("Company").fill(updatedCompany);
      await page.getByLabel("Notes").fill(updatedNotes);

      const saveButton = page.getByRole("button", { name: "Save changes" });

      await Promise.all([
        page.waitForResponse((response) => response.request().method() === "POST" && response.ok()),
        saveButton.click(),
      ]);

      await gotoAndWaitForHydration(page, "/applications");

      const card = applicationCard(page, updatedCompany);
      await expect(card).toBeVisible();
      await expect(card.getByText(updatedPosition)).toBeVisible();
      await expect(card.getByText(updatedNotes)).toBeVisible();

      await page.reload();
      await waitForHydration(page);

      await expect(applicationCard(page, updatedCompany).getByText(updatedNotes)).toBeVisible();
    } finally {
      await deleteApplicationFixtures(page, originalCompany, updatedCompany);
    }
  });

  test("deletes an application from the board menu", async ({ page }) => {
    const company = uniqueCompany("Board Delete");

    try {
      await createApplication(page, { position: "QA Engineer", company });
      await deleteApplicationFromBoard(page, company);

      await page.reload();
      await waitForHydration(page);

      await expect(applicationCard(page, company)).toHaveCount(0);
    } finally {
      await deleteApplicationFixtures(page, company);
    }
  });

  test("deletes an application from the detail page", async ({ page }) => {
    const company = uniqueCompany("Detail Delete");

    try {
      await createApplication(page, { position: "Site Reliability Engineer", company });
      await deleteApplicationFromDetail(page, company);

      await page.reload();
      await waitForHydration(page);

      await expect(applicationCard(page, company)).toHaveCount(0);
    } finally {
      await deleteApplicationFixtures(page, company);
    }
  });

  test("creates an application through the dialog below xl", async ({ page }) => {
    const company = uniqueCompany("Dialog");
    const position = "Mobile Engineer";

    try {
      await page.setViewportSize({ width: 900, height: 900 });
      await gotoApplications(page);

      await page.getByRole("button", { name: "New application" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      await dialog.getByLabel("Position").fill(position);
      await dialog.getByLabel("Company").fill(company);
      await dialog.getByLabel("Job listing link").fill("https://example.com/jobs/e2e-dialog");
      await dialog.getByRole("button", { name: "Add application" }).click();

      await expect(dialog).not.toBeVisible();
      await expect(applicationCard(page, company).getByText(position)).toBeVisible();
    } finally {
      await deleteApplicationFixtures(page, company);
    }
  });
});
