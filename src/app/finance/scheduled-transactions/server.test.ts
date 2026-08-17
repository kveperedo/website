import { afterEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/db/client";

import { createTransaction } from "../transactions/creation.server";
import {
  createScheduledTransactionTemplate,
  generateScheduledTransactions,
  getUpcomingScheduledTransactionTemplates,
  toggleScheduledTransactionTemplate,
} from "./server";

vi.mock("@/db/client", () => ({
  getDb: vi.fn(),
}));

vi.mock("../transactions/creation.server", () => ({
  createTransaction: vi.fn(),
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

const mockGeneration = (
  templates: Array<ReturnType<typeof template>>,
  findFirst = vi.fn().mockResolvedValue(null),
) => {
  const tx = {
    scheduledTransactionTemplate: {
      findUnique: vi.fn(({ where: { id } }) =>
        Promise.resolve(templates.find((template) => template.id === id) ?? null),
      ),
    },
    transaction: {
      count: vi.fn().mockResolvedValue(0),
      findFirst,
    },
  };
  vi.mocked(getDb).mockReturnValue({
    scheduledTransactionTemplate: {
      findMany: vi.fn().mockResolvedValue(templates),
    },
    $transaction: vi.fn((callback) => callback(tx)),
  } as never);
};

describe("getUpcomingScheduledTransactionTemplates", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
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

describe("generateScheduledTransactions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("creates a due transaction with the UTC occurrence date", async () => {
    mockGeneration([template("due", 1)]);
    vi.mocked(createTransaction).mockResolvedValue({
      id: "transaction-id",
      templateId: "due",
      description: "due",
    } as never);

    await generateScheduledTransactions(new Date("2026-07-01T00:05:00.000Z"));
    expect(createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ transactedAt: new Date("2026-07-01T00:00:00.000Z") }),
    );
  });

  it("does not create a duplicate when the occurrence already exists", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-transaction" });
    mockGeneration([template("due", 1)], findFirst);
    vi.mocked(createTransaction).mockResolvedValue({
      id: "transaction-id",
      templateId: "due",
      description: "due",
    } as never);

    const scheduledTime = new Date("2026-07-01T00:05:00.000Z");
    await generateScheduledTransactions(scheduledTime);
    await generateScheduledTransactions(scheduledTime);

    expect(createTransaction).toHaveBeenCalledTimes(1);
  });

  it("backfills missed current-month occurrences without creating prior-month occurrences", async () => {
    mockGeneration([
      template("current-month", 2),
      template("prior-month", 30, [], date("2026-06-30")),
    ]);
    vi.mocked(createTransaction).mockResolvedValue({
      id: "transaction-id",
      templateId: "current-month",
      description: "current-month",
    } as never);

    await generateScheduledTransactions(new Date("2026-07-05T00:05:00.000Z"));

    expect(createTransaction).toHaveBeenCalledTimes(1);
    expect(createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateId: "current-month" }),
    );
  });

  it("uses the final valid day for end-of-month schedules", async () => {
    mockGeneration([template("month-end", 31)]);
    vi.mocked(createTransaction).mockResolvedValue({
      id: "transaction-id",
      templateId: "month-end",
      description: "month-end",
    } as never);

    await generateScheduledTransactions(new Date("2026-02-28T00:05:00.000Z"));

    expect(createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ transactedAt: new Date("2026-02-28T00:00:00.000Z") }),
    );
  });

  it("continues after a template failure and reports the failed run", async () => {
    mockGeneration([template("failed", 1), template("created", 1)]);
    vi.mocked(createTransaction)
      .mockRejectedValueOnce(new Error("database error"))
      .mockResolvedValueOnce({
        id: "transaction-id",
        templateId: "created",
        description: "created",
      } as never);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      generateScheduledTransactions(new Date("2026-07-01T00:05:00.000Z")),
    ).rejects.toThrow("Failed to generate 1 scheduled transaction(s).");

    expect(createTransaction).toHaveBeenCalledTimes(2);
  });
});

describe("scheduled transaction mutations", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("conditionally links an existing transaction inside one transaction", async () => {
    const original = {
      ...template("transaction", 1),
      templateId: null,
      transactedAt: date("2026-07-01"),
    };
    const updated = { ...original, templateId: "template-id" };
    const tx = {
      transaction: {
        findUniqueOrThrow: vi.fn().mockResolvedValueOnce(original).mockResolvedValueOnce(updated),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      scheduledTransactionTemplate: {
        create: vi.fn().mockResolvedValue({ id: "template-id" }),
      },
    };
    vi.mocked(getDb).mockReturnValue({
      $transaction: vi.fn((callback) => callback(tx)),
    } as never);
    const schedule = { dayOfMonth: 1, endDate: null, maxOccurrences: null };

    await expect(
      createScheduledTransactionTemplate("transaction", schedule),
    ).resolves.toMatchObject({
      templateId: "template-id",
    });

    expect(tx.transaction.updateMany).toHaveBeenCalledWith({
      where: { id: "transaction", templateId: null },
      data: { templateId: "template-id" },
    });
  });

  it("preserves scheduling validation errors", async () => {
    const tx = {
      transaction: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ templateId: "template-id" }),
      },
    };
    vi.mocked(getDb).mockReturnValue({
      $transaction: vi.fn((callback) => callback(tx)),
    } as never);

    await expect(
      createScheduledTransactionTemplate("transaction", {
        dayOfMonth: 1,
        endDate: null,
        maxOccurrences: null,
      }),
    ).rejects.toThrow("This transaction is already scheduled.");
  });

  it("toggles a template through the transaction client", async () => {
    const tx = {
      scheduledTransactionTemplate: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ isActive: true }),
        update: vi.fn().mockResolvedValue({ ...template("template", 1), isActive: false }),
      },
    };
    vi.mocked(getDb).mockReturnValue({
      $transaction: vi.fn((callback) => callback(tx)),
    } as never);

    await expect(toggleScheduledTransactionTemplate("template")).resolves.toMatchObject({
      isActive: false,
    });
    expect(tx.scheduledTransactionTemplate.update).toHaveBeenCalledWith({
      where: { id: "template" },
      data: { isActive: false },
    });
  });
});
