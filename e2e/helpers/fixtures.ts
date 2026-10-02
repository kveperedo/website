import { expect, type Page } from "@playwright/test";
import { formatInTimeZone } from "date-fns-tz";

type TransactionCategory =
  | "food_drinks"
  | "groceries_household"
  | "transportation"
  | "bills_utilities"
  | "health_wellness"
  | "hobbies_lifestyle"
  | "financial";

type FixtureSchedule = {
  /** Defaults to today's day of month, matching both scheduling UIs. */
  dayOfMonth?: number;
  maxOccurrences?: number | null;
  /** `yyyy-MM-dd` */
  endDate?: string | null;
  status?: "active" | "paused";
};

type FixtureOptions = {
  amount?: number;
  type?: "expense" | "income";
  category?: TransactionCategory | null;
};

type FixtureIds = { transactionId: string | null; templateId: string | null };

const FIXTURES_URL = "/api/e2e/fixtures";

/**
 * Fixtures write rows straight to the database through an E2E-only endpoint, skipping the AI
 * parse and the page loads of the UI flows. Use them when creation is setup, not the subject.
 * Every row is dated today in the app's time zone.
 */
async function createFixture(
  page: Page,
  description: string,
  options: FixtureOptions & { schedule?: FixtureSchedule; withTransaction: boolean },
): Promise<FixtureIds> {
  const { schedule, ...rest } = options;
  const response = await page.request.post(FIXTURES_URL, {
    data: {
      description,
      amount: 75,
      ...rest,
      schedule: schedule && { dayOfMonth: getTodayDayOfMonth(), ...schedule },
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
}

const getTodayDayOfMonth = () => Number(formatInTimeZone(new Date(), "Asia/Manila", "d"));

export async function createTransactionFixture(
  page: Page,
  description: string,
  options: FixtureOptions = {},
): Promise<string> {
  const { transactionId } = await createFixture(page, description, {
    ...options,
    withTransaction: true,
  });
  return transactionId!;
}

/** Mirrors scheduling from the transaction form: a template plus today's linked transaction. */
export async function createScheduledTransactionFixture(
  page: Page,
  description: string,
  options: FixtureOptions & { schedule?: FixtureSchedule } = {},
): Promise<{ transactionId: string; templateId: string }> {
  const ids = await createFixture(page, description, {
    ...options,
    schedule: options.schedule ?? {},
    withTransaction: true,
  });
  return { transactionId: ids.transactionId!, templateId: ids.templateId! };
}

/** Mirrors `/finances/scheduled/new`: a template with no transaction yet. */
export async function createStandaloneTemplateFixture(
  page: Page,
  description: string,
  options: FixtureOptions & { schedule?: FixtureSchedule } = {},
): Promise<string> {
  const { templateId } = await createFixture(page, description, {
    ...options,
    schedule: options.schedule ?? {},
    withTransaction: false,
  });
  return templateId!;
}

/** Hard-deletes transactions and templates (archived included) by exact description. */
export async function deleteFixtures(page: Page, ...descriptions: Array<string>) {
  const response = await page.request.delete(FIXTURES_URL, { data: { descriptions } });
  expect(response.status(), await response.text()).toBe(204);
}
