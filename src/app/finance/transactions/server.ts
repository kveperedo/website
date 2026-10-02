import { waitUntil } from "cloudflare:workers";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import type { ScheduledTransactionInput } from "@/schema/scheduled-transaction";

import { generateJson } from "@/app/ai/server";
import { getDb } from "@/db/client";
import { TransactionCategory, TransactionType } from "@/generated/prisma/enums";
import { TransactionItemAISchema, type TransactionItemAIType } from "@/schema/transaction";

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

/** Healthy parses finish in a few seconds; Workers AI hangs run 30s+ (see `runWithTimeout`). */
const PARSE_BASE_TIMEOUT_MS = 10_000;
/** Each extra line adds output tokens, so larger batches get proportionally longer. */
const PARSE_TIMEOUT_PER_ITEM_MS = 1_000;
const MEMORY_LOOKUP_TIMEOUT_MS = 5_000;
/** Stays under the 30s Workers allow `waitUntil` work to run after the response. */
const MEMORY_UPDATE_TIMEOUT_MS = 20_000;

const enrichTransactionsWithMemory = async (
  transactions: Array<TransactionItemAIType>,
): Promise<Array<TransactionItemAIType>> => {
  try {
    const normalizedDescriptionList = transactions.map((tx) =>
      normalizeTransactionDescription(tx.description),
    );
    const exactMatches = await findExactTransactionMemory(
      normalizedDescriptionList.filter((value) => value.length > 0),
    );

    const pending = new Map<number, string>();
    transactions.forEach((tx, index) => {
      const hit = exactMatches.get(normalizedDescriptionList[index]);
      if (hit && normalizedDescriptionList[index].length > 0) {
        tx.type = hit.type;
        tx.category = hit.category;
        void incrementTransactionMemoryUseCount(hit.id).catch((err) => {
          console.error("Transaction memory touch failed:", err);
        });
      } else if (normalizedDescriptionList[index].length > 0) {
        pending.set(index, normalizedDescriptionList[index]);
      }
    });

    if (pending.size > 0) {
      const indexes = [...pending.keys()];
      // Failure falls back to the AI result below, so a slow lookup isn't worth waiting on.
      const vectors = await embedTransactionDescriptions(
        indexes.map((index) => pending.get(index)!),
        { timeoutMs: MEMORY_LOOKUP_TIMEOUT_MS },
      );
      const matches = await findClosestTransactionMemories(vectors);
      for (const [i, index] of indexes.entries()) {
        const match = matches[i];
        if (match) {
          const tx = transactions[index];
          tx.type = match.type;
          tx.category = match.category;
          void incrementTransactionMemoryUseCount(match.id).catch((err) => {
            console.error("Transaction memory touch failed:", err);
          });
        }
      }
    }

    return transactions;
  } catch (err) {
    console.error("Transaction memory lookup failed, using AI result:", err);
    return transactions;
  }
};

export const parseTransactions = async (
  items: Array<string>,
  localDate: string,
): Promise<Array<TransactionItemAIType>> => {
  const numberedItems = items.map((item, index) => `${index + 1}. ${item}`).join("\n");

  const instructions = `You are a transaction parser. The user's local date is ${localDate}. If no date is mentioned, transactedAt must be exactly ${localDate}.

Extract all transactions from the numbered input and return them in the transactions array — one entry per numbered input line, in the same order.

Rules:
- Each numbered input line is exactly one transaction — never merge lines and never split a line into multiple transactions.
- Preserve the original text in description — do not paraphrase or reword. Only fix typos (and only if you're highly confident). Remove raw numbers (amount field captures them). Preserve merchant/vendor names when present.

Examples:
- "1. lunch at jollibee for 150" → 1 transaction
- "1. lunch 150\\n2. grab home 200" → 2 transactions (same order)

Categories — required for every expense, never null when a category clearly applies:
- food_drinks: meals, coffee, snacks, delivery
- groceries_household: supermarket, toiletries, cleaning
- transportation: fuel, parking, rideshare, transit
- bills_utilities: electricity, water, internet, phone, rent, subscriptions
- health_wellness: medicine, doctor, gym, vitamins
- hobbies_lifestyle: entertainment, shopping, personal care, travel, gifts
- financial: transfers, bank fees, investments, loan payments
Only use null for income transactions or truly unrecognizable text (e.g. "payment 500" with no context).`;

  let result: { transactions: Array<TransactionItemAIType> };
  try {
    result = await generateJson({
      instructions,
      messages: [{ role: "user", content: numberedItems }],
      schema: z.object({
        transactions: z
          .array(TransactionItemAISchema)
          .describe(
            "All transactions found in the input, one per numbered input line in the same order.",
          ),
      }),
      maxTokens: 4096,
      timeoutMs: PARSE_BASE_TIMEOUT_MS + items.length * PARSE_TIMEOUT_PER_ITEM_MS,
      retries: 1,
    });
  } catch (err) {
    console.error("Workers AI parsing failed:", err);
    throw new Error("Failed to parse transactions with AI. Please try again.");
  }

  const parsed = result.transactions.map((tx) => ({
    ...tx,
    description: sanitizeHtml(tx.description, {
      allowedTags: [],
      allowedAttributes: {},
    }),
  }));

  return await enrichTransactionsWithMemory(parsed);
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
