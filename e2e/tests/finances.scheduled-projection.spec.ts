import { expect, test } from "@playwright/test";
import { getDaysInMonth } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { gotoAndWaitForHydration } from "../helpers/auth";
import { resetDatabase, seedDatabase, seedNetCardScenario } from "../helpers/database";
import {
  createScheduledTransaction,
  createTransaction,
  deleteScheduledTransactionTemplate,
  deleteTransaction,
  deleteTransactionByDescription,
  getScheduledTemplateId,
  openScheduledTemplateForEdit,
} from "../helpers/transactions";

const TIME_ZONE = "Asia/Manila";

test.describe.configure({ mode: "serial", timeout: 60000 });

async function getManilaToday(page: import("@playwright/test").Page) {
  return await page.evaluate(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(now);
    const year = Number(parts.find((p) => p.type === "year")!.value);
    const month = Number(parts.find((p) => p.type === "month")!.value);
    const day = Number(parts.find((p) => p.type === "day")!.value);
    return { year, month, day };
  });
}

async function getFutureDayOfMonth(page: import("@playwright/test").Page) {
  const { year, month, day } = await getManilaToday(page);
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  // Avoid last-day-of-month skip: wrap to 2 so tests always have a future day
  if (day >= daysInMonth) {
    return 2;
  }
  return day + 1;
}

async function updateScheduledDayOfMonth(
  page: import("@playwright/test").Page,
  description: string,
  dayOfMonth: number,
) {
  const templateId = await getScheduledTemplateId(page, description);
  await openScheduledTemplateForEdit(page, templateId);
  const dayInput = page.getByLabel("Day of month");
  await expect(dayInput).toBeVisible();
  await dayInput.fill(String(dayOfMonth));
  const saveButton = page.getByRole("button", { name: "Save Changes" });
  await saveButton.click();
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toBeEnabled({ timeout: 15000 });
  await expect(page.getByText("Will generate on the last day")).toHaveCount(
    dayOfMonth > 28 ? 1 : 0,
  );
}

test.describe("scheduled expense projection in summary net card", () => {
  test("shows single-segment progress when no scheduled expenses exist", async ({ page }) => {
    try {
      await seedNetCardScenario(page, "on-pace");
      await gotoAndWaitForHydration(page, "/finances");

      const monthLabel = formatInTimeZone(new Date(), TIME_ZONE, "MMMM yyyy");
      await expect(page.getByText(`Your ${monthLabel} finances so far`)).toBeVisible();

      const singleProgress = page.getByTestId("expense-progress-single");
      await expect(singleProgress).toBeVisible();
      await expect(singleProgress).toHaveAttribute("role", "progressbar");
      await expect(singleProgress).toHaveAttribute(
        "aria-label",
        "Expenses as a percentage of income",
      );
      await expect(singleProgress).toHaveAttribute("aria-valuemin", "0");
      await expect(singleProgress).toHaveAttribute("aria-valuemax", "100");
      await expect(singleProgress).toHaveAttribute("aria-valuetext", "50% of income");
      // Hardcoded expectation: on-pace is 500/1000 = 50% — mirrors getExpenseProgress in expense-progress.ts
      await expect(singleProgress).toHaveAttribute("aria-valuenow", "50");

      // Lightweight div bar verification (replaces recharts): actual + remaining
      await expect(singleProgress.getByTestId("expense-progress-actual")).toBeVisible();
      await expect(singleProgress.getByTestId("expense-progress-actual")).toHaveAttribute(
        "style",
        /width:\s*50%/,
      );
      await expect(singleProgress.getByTestId("expense-progress-actual")).toHaveAttribute(
        "style",
        /var\(--color-emerald-400\)/,
      );
      await expect(singleProgress.getByTestId("expense-progress-remaining")).toBeVisible();
      await expect(singleProgress.getByTestId("expense-progress-remaining")).toHaveAttribute(
        "style",
        /width:\s*50%/,
      );
      // Scheduled segment not rendered when hasScheduled=false (0%)
      await expect(singleProgress.getByTestId("expense-progress-scheduled")).toHaveCount(0);

      // Projected variant should not be present
      await expect(page.getByTestId("expense-progress-projected")).toHaveCount(0);
      await expect(
        page.getByRole("progressbar", {
          name: "Expenses as a percentage of income including scheduled",
        }),
      ).toHaveCount(0);

      // Textual percentage still rendered
      await expect(page.getByText("Expenses are 50% of income")).toBeVisible();
    } finally {
      await resetDatabase(page);
      await seedDatabase(page);
    }
  });

  test("shows projected dual-segment bar including future scheduled expense", async ({ page }) => {
    const description = `Projected E2E ${Date.now()}`;
    const futureDay = await getFutureDayOfMonth(page);

    try {
      await seedNetCardScenario(page, "on-pace");
      await gotoAndWaitForHydration(page, "/finances");

      // Create scheduled expense (today) then move its dayOfMonth to tomorrow so it is counted as future
      // PARSE_TEXT parses 75 — matches transactions.ts
      await createScheduledTransaction(page, description, { endType: "none" });
      await updateScheduledDayOfMonth(page, description, futureDay);

      await gotoAndWaitForHydration(page, "/finances");

      const projected = page.getByTestId("expense-progress-projected");
      await expect(projected).toBeVisible();
      await expect(projected).toHaveAttribute("role", "progressbar");
      await expect(projected).toHaveAttribute(
        "aria-label",
        "Expenses as a percentage of income including scheduled",
      );
      await expect(projected).toHaveAttribute("aria-valuemin", "0");
      await expect(projected).toHaveAttribute("aria-valuemax", "100");

      // After seeding "on-pace" (income 1000, expenses 500) and creating a 75-expense scheduled transaction,
      // current expenses become 575 and the future scheduled occurrence adds another 75.
      // 575/1000=58% actual, 650/1000=65% projected — hardcoded to avoid mirroring helper
      await expect(projected).toHaveAttribute("aria-valuenow", "65");
      await expect(projected).toHaveAttribute(
        "aria-valuetext",
        "58% of income, 65% with scheduled",
      );

      // Lightweight div bar: 3 segments (actual + scheduled + remaining)
      const actual = projected.getByTestId("expense-progress-actual");
      const scheduled = projected.getByTestId("expense-progress-scheduled");
      const remaining = projected.getByTestId("expense-progress-remaining");
      await expect(actual).toBeVisible();
      await expect(actual).toHaveAttribute("style", /width:\s*58%/);
      await expect(actual).toHaveAttribute("style", /var\(--color-emerald-400\)/);
      await expect(scheduled).toBeVisible();
      await expect(scheduled).toHaveAttribute("style", /width:\s*7%/);
      // Scheduled uses hatched pattern with translucent emerald
      await expect(scheduled).toHaveAttribute("data-fill", "var(--color-emerald-400)");
      await expect(scheduled).toHaveAttribute("data-opacity", "35%");
      await expect(scheduled).toHaveAttribute("style", /repeating-linear-gradient/);
      await expect(scheduled).toHaveAttribute("style", /var\(--foreground\)/);
      await expect(remaining).toBeVisible();
      await expect(remaining).toHaveAttribute("style", /width:\s*35%/);

      // Single-segment progress should not be visible when projected is shown
      await expect(page.getByTestId("expense-progress-single")).toHaveCount(0);
      await expect(
        page.getByRole("progressbar", { name: "Expenses as a percentage of income", exact: true }),
      ).toHaveCount(0);

      // Verify textual breakdown still shows actual percentage
      await expect(page.getByText("Expenses are 58% of income")).toBeVisible();
    } finally {
      try {
        await deleteScheduledTransactionTemplate(page, description);
      } finally {
        await deleteTransactionByDescription(page, description);
        await resetDatabase(page);
        await seedDatabase(page);
      }
    }
  });

  test("projected bar handles over-income with destructive pattern", async ({ page }) => {
    const description = `OverIncome E2E ${Date.now()}`;
    const futureDay = await getFutureDayOfMonth(page);

    try {
      await seedNetCardScenario(page, "on-pace");
      await gotoAndWaitForHydration(page, "/finances");
      await createScheduledTransaction(page, description, { endType: "none" });
      await updateScheduledDayOfMonth(page, description, futureDay);

      // Edit amount to be large via template edit page to push projected over 100%
      const templateId = await getScheduledTemplateId(page, description);
      await openScheduledTemplateForEdit(page, templateId);
      const amountInput = page.getByLabel("Amount");
      await expect(amountInput).toBeVisible();
      await amountInput.fill("600");
      const saveButton = page.getByRole("button", { name: "Save Changes" });
      await saveButton.click();
      await expect(saveButton).toBeDisabled();
      await expect(saveButton).toBeEnabled({ timeout: 15000 });

      await gotoAndWaitForHydration(page, "/finances");
      const projected = page.getByTestId("expense-progress-projected");
      await expect(projected).toBeVisible();

      // When projected >100, scheduled pattern should use destructive variant
      const scheduled = projected.getByTestId("expense-progress-scheduled");
      await expect(scheduled).toHaveAttribute("data-fill", "var(--destructive)");
      await expect(scheduled).toHaveAttribute("data-opacity", "40%");
      await expect(scheduled).toHaveAttribute("style", /var\(--destructive\)/);

      // Actual bar still emerald (since actual 58% <100), only scheduled pattern destructive
      const actual = projected.getByTestId("expense-progress-actual");
      await expect(actual).toHaveAttribute("style", /var\(--color-emerald-400\)/);
    } finally {
      try {
        await deleteScheduledTransactionTemplate(page, description);
      } finally {
        await deleteTransactionByDescription(page, description);
        await resetDatabase(page);
        await seedDatabase(page);
      }
    }
  });

  test("reverts to single-segment after deleting scheduled template", async ({ page }) => {
    const description = `Revert E2E ${Date.now()}`;
    const futureDay = await getFutureDayOfMonth(page);

    try {
      await seedNetCardScenario(page, "on-pace");
      await gotoAndWaitForHydration(page, "/finances");
      await createScheduledTransaction(page, description, { endType: "none" });
      await updateScheduledDayOfMonth(page, description, futureDay);
      await gotoAndWaitForHydration(page, "/finances");
      await expect(page.getByTestId("expense-progress-projected")).toBeVisible();

      await deleteScheduledTransactionTemplate(page, description);
      await deleteTransactionByDescription(page, description);

      await gotoAndWaitForHydration(page, "/finances");
      await expect(page.getByTestId("expense-progress-projected")).toHaveCount(0);
      await expect(page.getByTestId("expense-progress-single")).toBeVisible();
      await expect(
        page.getByRole("progressbar", { name: "Expenses as a percentage of income", exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("expense-progress-single")).toBeVisible();
    } finally {
      try {
        await deleteScheduledTransactionTemplate(page, description);
      } finally {
        await deleteTransactionByDescription(page, description);
        await resetDatabase(page);
        await seedDatabase(page);
      }
    }
  });

  test("hides expense progress when no income is recorded", async ({ page }) => {
    try {
      await seedNetCardScenario(page, "over-income");
      await gotoAndWaitForHydration(page, "/finances");

      await expect(page.getByText("No income recorded this month")).toBeVisible();
      await expect(page.getByRole("progressbar", { name: /Expenses as a percentage/ })).toHaveCount(
        0,
      );
      await expect(page.getByTestId("expense-progress-projected")).toHaveCount(0);
      await expect(page.getByTestId("expense-progress-single")).toHaveCount(0);
    } finally {
      await resetDatabase(page);
      await seedDatabase(page);
    }
  });

  test("single-segment over-income uses destructive fill", async ({ page }) => {
    const largeDescription = `Large expense ${Date.now()}`;
    try {
      await seedNetCardScenario(page, "on-pace");
      await gotoAndWaitForHydration(page, "/finances/transactions");

      // Create a large expense to push actual over income (on-pace is 500/1000, add 700 => 1200/1000 = 120%)
      const id = await createTransaction(page, `${largeDescription} 700`, largeDescription);
      await gotoAndWaitForHydration(page, "/finances");

      const single = page.getByTestId("expense-progress-single");
      await expect(single).toBeVisible();
      // aria-valuenow is capped at 100
      await expect(single).toHaveAttribute("aria-valuenow", "100");
      await expect(single).toHaveAttribute("aria-valuetext", "120% of income");
      await expect(single.getByTestId("expense-progress-actual")).toHaveAttribute(
        "style",
        /var\(--destructive\)/,
      );
      await expect(single.getByTestId("expense-progress-actual")).toHaveAttribute(
        "style",
        /width:\s*100%/,
      );

      await deleteTransaction(page, id);
    } finally {
      await resetDatabase(page);
      await seedDatabase(page);
    }
  });
});
