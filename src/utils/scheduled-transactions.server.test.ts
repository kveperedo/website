import { afterEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/db/client";

import { getUpcomingScheduledTransactionTemplates } from "./scheduled-transactions.server";

vi.mock("@/db/client", () => ({
  getDb: vi.fn(),
}));

const date = (value: string) => new Date(`${value}T12:00:00`);

const template = (
  id: string,
  dayOfMonth: number,
  transactions: Array<{ transactedAt: Date }> = [],
  endDate: Date | null = null,
) => ({
  id,
  description: id,
  amount: { toNumber: () => 100 },
  type: "expense",
  category: null,
  dayOfMonth,
  startDate: date("2026-01-01"),
  endDate,
  maxOccurrences: null,
  isActive: true,
  sourceTransactionId: null,
  createdAt: date("2026-01-01"),
  updatedAt: date("2026-01-01"),
  _count: { transactions: transactions.length },
  transactions,
});

const mockTemplates = (templates: Array<ReturnType<typeof template>>) => {
  vi.mocked(getDb).mockReturnValue({
    scheduledTransactionTemplate: {
      findMany: vi.fn().mockResolvedValue(templates),
    },
  } as never);
};

describe("getUpcomingScheduledTransactionTemplates", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the first three occurrences across the current and next month", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T10:00:00"));
    mockTemplates([
      template("jul-31", 31),
      template("aug-01", 1),
      template("aug-03", 3),
      template("aug-10", 10),
    ]);

    const upcoming = await getUpcomingScheduledTransactionTemplates();

    expect(upcoming).toMatchObject([
      { label: "July", transactions: [{ id: "jul-31" }] },
      { label: "August", transactions: [{ id: "aug-01" }, { id: "aug-03" }] },
    ]);
  });

  it("uses a next-month occurrence when the current-month occurrence is recorded", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T10:00:00"));
    mockTemplates([
      template("monthly-31", 31, [{ transactedAt: new Date("2026-07-31T00:00:00") }]),
      template("aug-01", 1),
      template("aug-03", 3),
    ]);

    const upcoming = await getUpcomingScheduledTransactionTemplates();

    expect(upcoming.flatMap((group) => group.transactions.map((item) => item.id))).toEqual([
      "aug-01",
      "aug-03",
      "monthly-31",
    ]);
  });

  it("excludes due-today occurrences and returns fewer than three when necessary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T10:00:00"));
    mockTemplates([template("due-today", 29, [], date("2026-07-29")), template("aug-01", 1)]);

    const upcoming = await getUpcomingScheduledTransactionTemplates();

    expect(upcoming.flatMap((group) => group.transactions.map((item) => item.id))).toEqual([
      "aug-01",
    ]);
  });
});
