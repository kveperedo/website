import { expect, type Locator, type Page } from "@playwright/test";

import { gotoAndWaitForHydration } from "./auth";

const APPLICATIONS_URL = "/applications";
const APPLICATIONS_FIXTURES_URL = "/api/e2e/applications";

export type ApplicationStatus = "saved" | "applied" | "offer" | "rejected" | "withdrawn";

export type ApplicationInput = {
  position: string;
  company: string;
  link?: string;
  notes?: string;
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** A board card, scoped by the company shown in its heading. */
export const applicationCard = (page: Page, company: string): Locator =>
  page.locator("[data-application-id]").filter({ hasText: company });

export async function gotoApplications(page: Page) {
  await gotoAndWaitForHydration(page, APPLICATIONS_URL);
}

/** Opens the add form, which is a side panel at `xl+` and a dialog below it. */
export async function openApplicationForm(page: Page): Promise<Locator> {
  if ((await page.locator("form:visible").count()) === 0) {
    await page.getByRole("button", { name: "New application" }).click();
  }

  const form = page.locator("form:visible");
  await expect(form).toBeVisible();

  return form;
}

/** Fills and submits the add form on the current applications page. */
export async function addApplication(page: Page, input: ApplicationInput) {
  const form = await openApplicationForm(page);

  await form.getByLabel("Position").fill(input.position);
  await form.getByLabel("Company").fill(input.company);
  await form.getByLabel("Job listing link").fill(input.link ?? "https://example.com/jobs/e2e");

  if (input.notes) {
    await form.getByLabel("Notes").fill(input.notes);
  }

  await page.getByRole("button", { name: "Add application" }).click();
  await expect(applicationCard(page, input.company)).toBeVisible();
}

export async function createApplication(page: Page, input: ApplicationInput) {
  await gotoApplications(page);
  await addApplication(page, input);
}

export async function openApplicationMenu(page: Page, company: string) {
  await applicationCard(page, company).getByRole("button", { name: "Application actions" }).click();
}

export async function changeApplicationStatus(
  page: Page,
  company: string,
  status: ApplicationStatus,
) {
  await openApplicationMenu(page, company);

  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.ok()),
    page.getByRole("menuitem", { name: STATUS_LABELS[status] }).click(),
  ]);
}

export async function openApplicationDetail(page: Page, company: string) {
  await openApplicationMenu(page, company);
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.waitForURL(/\/applications\/[0-9a-f-]{36}\/?$/);
}

async function confirmDeleteDialog(page: Page) {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
}

export async function deleteApplicationFromBoard(page: Page, company: string) {
  await openApplicationMenu(page, company);
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await confirmDeleteDialog(page);
  await expect(applicationCard(page, company)).toHaveCount(0);
}

export async function deleteApplicationFromDetail(page: Page, company: string) {
  await openApplicationDetail(page, company);
  await page.getByRole("button", { name: "Delete application" }).click();
  await confirmDeleteDialog(page);
  await expect(page).toHaveURL(/\/applications\/?$/);
  await expect(applicationCard(page, company)).toHaveCount(0);
}

/** Hard-deletes job applications by company after a test. */
export async function deleteApplicationFixtures(page: Page, ...companies: Array<string>) {
  const response = await page.request.delete(APPLICATIONS_FIXTURES_URL, {
    data: { companies },
  });
  expect(response.status(), await response.text()).toBe(204);
}
