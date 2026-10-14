import { waitUntil } from "cloudflare:workers";
import { z } from "zod";

import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import type { ScheduledTransactionInput } from "@/schema/scheduled-transaction";

import { runDecisionModel, type ChoiceQuestion, type NoulQuestion } from "@/app/ai/server";
import { getDb } from "@/db/client";
import { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

import {
  databaseDateToDateOnly,
  getCurrentMonthRange,
  getCurrentYearMonth,
  startOfLocalMonth,
  startOfNextLocalMonth,
} from "../local-date";
import { createScheduledTransaction } from "../scheduled-transactions/server";
import { createTransaction } from "./creation.server";
import {
  embedTransactionDescriptions,
  findExactTransactionMemory,
  findClosestTransactionMemories,
  normalizeTransactionDescription,
  incrementTransactionMemoryUseCount,
  upsertTransactionMemories,
} from "./memory.server";

/** What the frontend parsed locally and hands over for a type and category. */
type TransactionToClassify = {
  description: string;
  amount: number | null;
  transactedAt: string;
};

export const getRecentTransactions = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  const transactions = await getDb().transaction.findMany({
    where: { transactedAt: { gte: monthStart, lt: monthEnd } },
    orderBy: [{ transactedAt: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  return transactions.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
  }));
};

type GetTransactionsByMonthInput = {
  year: number;
  month: number;
  q?: string;
  type?: TransactionType;
  categories?: Array<TransactionCategory>;
};

const buildTransactionFilters = ({
  q,
  type,
  categories,
}: Omit<GetTransactionsByMonthInput, "year" | "month">) => ({
  ...(q ? { description: { contains: q, mode: "insensitive" as const } } : {}),
  ...(type ? { type } : {}),
  ...(categories?.length ? { category: { in: categories } } : {}),
});

export const getTransactionsByMonth = async ({
  year,
  month,
  q,
  type,
  categories,
}: GetTransactionsByMonthInput) => {
  const monthStart = startOfLocalMonth(year, month);
  const monthEnd = startOfNextLocalMonth(year, month);

  const transactions = await getDb().transaction.findMany({
    where: {
      transactedAt: { gte: monthStart, lt: monthEnd },
      ...buildTransactionFilters({ q, type, categories }),
    },
    orderBy: [{ transactedAt: "desc" }, { createdAt: "desc" }],
  });

  return transactions.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
  }));
};

export const getMonthlySummaryByMonth = async ({
  year,
  month,
  q,
  type,
  categories,
}: GetTransactionsByMonthInput) => {
  const monthStart = startOfLocalMonth(year, month);
  const monthEnd = startOfNextLocalMonth(year, month);

  const grouped = await getDb().transaction.groupBy({
    by: ["type"],
    where: {
      transactedAt: { gte: monthStart, lt: monthEnd },
      ...buildTransactionFilters({ q, type, categories }),
    },
    _sum: { amount: true },
    _count: true,
  });

  const income = Number(grouped.find((g) => g.type === "income")?._sum.amount ?? 0);
  const expenses = Number(grouped.find((g) => g.type === "expense")?._sum.amount ?? 0);
  const transactionCount = grouped.reduce((sum, g) => sum + g._count, 0);

  return { income, expenses, transactionCount };
};

export const getMonthlySummary = async () => {
  const summary = await getMonthlySummaryByMonth(getCurrentYearMonth());
  return { ...summary, net: summary.income - summary.expenses };
};

export const getCategorySummary = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  const grouped = await getDb().transaction.groupBy({
    by: ["category"],
    where: {
      type: "expense",
      category: { not: null },
      transactedAt: { gte: monthStart, lt: monthEnd },
    },
    _sum: { amount: true },
  });

  return grouped
    .map((g) => ({ category: g.category!, total: g._sum.amount!.toNumber() }))
    .sort((a, b) => b.total - a.total);
};

const ALL_CATEGORIES = Object.values(TransactionCategory);

const TREND_MONTHS = 6;

export type CategoryTrendRow = { month: string } & Record<TransactionCategory, number>;

const emptyMonth = (): Record<TransactionCategory, number> =>
  Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0])) as Record<TransactionCategory, number>;

export const getCategoryTrends = async () => {
  const { year, month } = getCurrentYearMonth();
  const trendsStart = startOfLocalMonth(year, month - (TREND_MONTHS - 1));
  const trendsEnd = startOfNextLocalMonth(year, month);

  const rows = await getDb().$queryRaw<
    Array<{ month: string; category: TransactionCategory; total: number }>
  >`
    SELECT
      TO_CHAR("transacted_at", 'YYYY-MM') AS month,
      category,
      SUM(amount)::float AS total
    FROM transactions
    WHERE "transacted_at" >= ${trendsStart}
      AND "transacted_at" < ${trendsEnd}
      AND type = 'expense'
      AND category IS NOT NULL
    GROUP BY month, category
    ORDER BY month ASC
  `;

  return rows.reduce<Array<CategoryTrendRow>>((result, row) => {
    const last = result[result.length - 1];
    if (last?.month === row.month) {
      last[row.category] = row.total;
    } else {
      result.push({ month: row.month, ...emptyMonth(), [row.category]: row.total });
    }
    return result;
  }, []);
};

/** A memory query and an embedding call shouldn't stall the classification behind them. */
const MEMORY_LOOKUP_TIMEOUT_MS = 5_000;
/** Median decision latency is ~40ms, so anything past this is a hang rather than a slow call. */
const DECISION_TIMEOUT_MS = 5_000;
/** Bounds the fan-out so one batch of twenty can't open twenty binding calls at once. */
const DECISION_CONCURRENCY = 5;
/** Probability at or above which money is judged to be coming in. */
const INCOME_PROBABILITY_THRESHOLD = 0.5;
/** Stays under the 30s Workers allow `waitUntil` work to run after the response. */
const MEMORY_UPDATE_TIMEOUT_MS = 20_000;

/** One question per transaction, so each description is judged on its own terms. */
type TransactionQuestions = {
  type: NoulQuestion;
  category: ChoiceQuestion & { criteria: Record<TransactionCategory, string> };
};

/**
 * The decision model answers a yes/no for the direction of cash flow and a pick-one for category.
 * Category is asked unconditionally because the model scores all questions in one pass, but it is
 * discarded for income — that pairing is not a meaningful one.
 */
const DECISION_QUESTIONS: TransactionQuestions = {
  type: {
    type: "noul",
    instructions: "Is this transaction money coming in rather than money going out?",
    criteria: {
      true: "Money received: salary, refund, cashback, allowance, reimbursement, interest.",
      false: "Money going out: a purchase, a bill, a payment, or a transfer.",
    },
  },
  category: {
    type: "choice",
    instructions: "Which category best fits this transaction?",
    criteria: {
      food_drinks: "Meals, coffee, snacks, and food delivery.",
      groceries_household: "Supermarket shopping, toiletries, and cleaning supplies.",
      transportation: "Fuel, parking, rideshare, and public transit.",
      bills_utilities: "Electricity, water, internet, phone, rent, and subscriptions.",
      health_wellness: "Medicine, doctor visits, the gym, and vitamins.",
      hobbies_lifestyle: "Entertainment, shopping, personal care, travel, and gifts.",
      financial: "Transfers, bank fees, investments, and loan payments.",
    },
  },
};

const DecisionAnswerSchema = z.object({
  answers: z.object({
    type: z.object({ noul: z.number().min(0).max(1) }),
    category: z.object({ choice: z.enum(TransactionCategory) }),
  }),
});

export type TransactionClassification = {
  type: TransactionType;
  category: TransactionCategory | null;
};

/** An unclassified transaction still has to be saveable, so guess the common case and move on. */
const fallbackClassification = (): TransactionClassification => ({
  type: "expense",
  category: null,
});

const classifyWithDecisionModel = async (
  transaction: TransactionToClassify,
): Promise<TransactionClassification> => {
  try {
    const { answers } = await runDecisionModel(
      { state: transaction, questions: DECISION_QUESTIONS },
      DecisionAnswerSchema,
      { timeoutMs: DECISION_TIMEOUT_MS },
    );

    const type = answers.type.noul >= INCOME_PROBABILITY_THRESHOLD ? "income" : "expense";

    return { type, category: type === "income" ? null : answers.category.choice };
  } catch (err) {
    console.error("Decision model classification failed:", err);
    return fallbackClassification();
  }
};

/**
 * Learns from previous saves first: a remembered description is the user's own past decision and
 * beats any model guess. Only descriptions with no memory hit reach the decision model.
 */
export const classifyTransactions = async (
  transactions: Array<TransactionToClassify>,
): Promise<Array<TransactionClassification>> => {
  const classifications = transactions.map(fallbackClassification);
  const normalized = transactions.map((transaction) =>
    normalizeTransactionDescription(transaction.description),
  );

  const applyMemory = (index: number, memory: { id: string } & TransactionClassification) => {
    classifications[index] = { type: memory.type, category: memory.category };
    void incrementTransactionMemoryUseCount(memory.id).catch((err) => {
      console.error("Transaction memory touch failed:", err);
    });
  };

  // Nothing to remember or look up for a description that normalises away, so those stay out of
  // both the memory tiers and the model. Declared outside the try so a failed lookup leaves the
  // rest to the model rather than silently dropping them.
  let pending = normalized.flatMap((value, index) => (value.length > 0 ? [index] : []));

  try {
    const exactMatches = await findExactTransactionMemory(
      pending.map((index) => normalized[index]),
    );
    const stillPending: Array<number> = [];

    for (const index of pending) {
      const hit = exactMatches.get(normalized[index]);
      if (hit) {
        applyMemory(index, hit);
      } else {
        stillPending.push(index);
      }
    }
    pending = stillPending;

    if (pending.length > 0) {
      const vectors = await embedTransactionDescriptions(
        pending.map((index) => normalized[index]),
        { timeoutMs: MEMORY_LOOKUP_TIMEOUT_MS },
      );
      const matches = await findClosestTransactionMemories(vectors);
      const undecided: Array<number> = [];

      pending.forEach((index, position) => {
        const match = matches[position];
        if (match) {
          applyMemory(index, match);
        } else {
          undecided.push(index);
        }
      });
      pending = undecided;
    }
  } catch (err) {
    console.error("Transaction memory lookup failed:", err);
  }

  for (let start = 0; start < pending.length; start += DECISION_CONCURRENCY) {
    const batch = pending.slice(start, start + DECISION_CONCURRENCY);
    const decisions = await Promise.all(
      batch.map((index) => classifyWithDecisionModel(transactions[index])),
    );
    batch.forEach((index, position) => {
      classifications[index] = decisions[position];
    });
  }

  return classifications;
};

type CreateTransactionsInput = Omit<TransactionInputType, "template" | "templateId"> & {
  schedule?: ScheduledTransactionInput;
};

const rememberTransactions = async (
  data: Array<Pick<CreateTransactionsInput, "description" | "type" | "category">>,
): Promise<void> => {
  try {
    const entries = data
      .map((transaction) => ({
        normalizedDescription: normalizeTransactionDescription(transaction.description),
        type: transaction.type,
        category: transaction.type === "income" ? null : (transaction.category ?? null),
      }))
      .filter((entry) => entry.normalizedDescription.length > 0);
    if (entries.length === 0) {
      return;
    }
    const vectors = await embedTransactionDescriptions(
      entries.map((entry) => entry.normalizedDescription),
      { timeoutMs: MEMORY_UPDATE_TIMEOUT_MS },
    );
    await upsertTransactionMemories(
      entries.map((entry, index) => ({ ...entry, embedding: vectors[index] })),
    );
  } catch (err) {
    console.error("Transaction memory update failed:", err);
  }
};

/** Memory only speeds up future parses, so saves respond without waiting on the embedding. */
const rememberTransactionsInBackground = (
  data: Parameters<typeof rememberTransactions>[0],
): void => {
  waitUntil(rememberTransactions(data));
};

export const createTransactions = async (data: Array<CreateTransactionsInput>) => {
  const db = getDb();

  if (data.every(({ schedule }) => !schedule)) {
    const result = await db.$transaction((tx) =>
      tx.transaction.createMany({
        data: data.map(({ schedule: _schedule, ...transaction }) => ({
          ...transaction,
          category: transaction.category ?? undefined,
        })),
      }),
    );

    rememberTransactionsInBackground(data);

    return { count: result.count };
  }

  await db.$transaction(async (tx) => {
    for (const { schedule, ...transaction } of data) {
      if (schedule) {
        await createScheduledTransaction(tx, transaction, schedule);
      } else {
        await createTransaction(tx, transaction);
      }
    }
  });

  rememberTransactionsInBackground(data);

  return { count: data.length };
};

export const getTransactionById = async (id: string) => {
  const transaction = await getDb().transaction.findUniqueOrThrow({
    where: { id },
    include: {
      template: {
        select: {
          dayOfMonth: true,
          endDate: true,
          maxOccurrences: true,
          status: true,
          _count: { select: { transactions: true } },
        },
      },
    },
  });
  return {
    ...transaction,
    amount: transaction.amount.toNumber(),
    template: transaction.template && {
      ...transaction.template,
      endDate: transaction.template.endDate
        ? databaseDateToDateOnly(transaction.template.endDate)
        : null,
    },
  };
};

export const updateTransaction = async (id: string, data: TransactionInputType) => {
  const transaction = await getDb().transaction.update({
    where: { id },
    data: {
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.type === "income" ? null : (data.category ?? null),
      transactedAt: data.transactedAt,
    },
  });

  rememberTransactionsInBackground([
    {
      description: data.description,
      type: data.type,
      category: data.type === "income" ? null : (data.category ?? null),
    },
  ]);

  return { ...transaction, amount: transaction.amount.toNumber() };
};

export const deleteTransaction = async (id: string) => {
  await getDb().transaction.delete({ where: { id } });
};
