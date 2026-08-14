import { Agent, run, tool } from "@openai/agents";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import type { ScheduledTransactionInput } from "@/schema/scheduled-transaction";

import { getDb } from "@/db/client";
import { TransactionCategory, TransactionType } from "@/generated/prisma/enums";
import { TransactionItemAISchema, type TransactionItemAIType } from "@/schema/transaction";

import {
  databaseDateToDateOnly,
  endOfLocalMonth,
  getCurrentMonthRange,
  getCurrentYearMonth,
  startOfLocalMonth,
} from "../local-date";
import { createScheduledTransaction } from "../scheduled-transactions/server";
import { createTransaction } from "./creation.server";

export { getMonthlyHistory } from "./history.server";
export type { MonthlyHistory, MonthlyHistoryEntry } from "./history.server";

export const getRecentTransactions = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  const transactions = await getDb().transaction.findMany({
    where: { transactedAt: { gte: monthStart, lt: monthEnd } },
    orderBy: { transactedAt: "desc" },
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

export const getTransactionsByMonth = async ({
  year,
  month,
  q,
  type,
  categories,
}: GetTransactionsByMonthInput) => {
  const monthStart = startOfLocalMonth(year, month);
  const monthEnd = endOfLocalMonth(year, month);

  const transactions = await getDb().transaction.findMany({
    where: {
      transactedAt: { gte: monthStart, lt: monthEnd },
      ...(q ? { description: { contains: q, mode: "insensitive" } } : {}),
      ...(type ? { type } : {}),
      ...(categories?.length ? { category: { in: categories } } : {}),
    },
    orderBy: { transactedAt: "desc" },
  });

  return transactions.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
  }));
};

export const getMonthlySummary = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  const grouped = await getDb().transaction.groupBy({
    by: ["type"],
    where: { transactedAt: { gte: monthStart, lt: monthEnd } },
    _sum: { amount: true },
    _count: true,
  });

  const income = Number(grouped.find((g) => g.type === "income")?._sum.amount ?? 0);
  const expenses = Number(grouped.find((g) => g.type === "expense")?._sum.amount ?? 0);
  const transactionCount = grouped.reduce((sum, g) => sum + g._count, 0);

  return { income, expenses, net: income - expenses, transactionCount };
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
  const trendsEnd = endOfLocalMonth(year, month);

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

export const parseTransactions = async (
  text: string,
  localDate: string,
): Promise<Array<TransactionItemAIType>> => {
  let parsedResult: Array<TransactionItemAIType> | null = null;

  const parseTransactionsTool = tool({
    name: "parse_transactions",
    description: `Extract all transactions from a description. Returns an array — one entry per transaction mentioned.

Splitting rules:
- Each new line typically represents a separate transaction.
- If a single line contains multiple amounts (e.g. "lunch 150 and grab 200"), split into separate transactions — one per amount.
- When both signals are present, prefer the one that produces more transactions (don't merge what should be separate).

Examples:
- "lunch at jollibee for 150" → 1 transaction
- "lunch 150\\ngrab home 200" → 2 transactions (line break)
- "lunch 150 and grab home 200" → 2 transactions (two amounts)
- "groceries 800, gas 500, Netflix 200" → 3 transactions`,
    parameters: z.object({
      transactions: z
        .array(TransactionItemAISchema)
        .describe("All transactions found in the input. Single transaction = array of one."),
    }),
    execute: async ({ transactions }) => {
      parsedResult = transactions;
      return "Transactions parsed.";
    },
  });

  const agent = new Agent({
    name: "transaction_parser",
    model: "gpt-5.4-nano",
    instructions: `You are a transaction parser. The user's local date is ${localDate}. If no date is mentioned, transactedAt must be exactly ${localDate}. Parse the user's input into structured transactions by calling the parse_transactions tool. Always call the tool even for a single transaction.`,
    tools: [parseTransactionsTool],
  });

  try {
    await run(agent, text);
  } catch (err) {
    console.error("OpenAI parsing failed:", err);
    throw new Error("Failed to parse transactions with AI. Please try again.");
  }

  if (!parsedResult) {
    throw new Error("Failed to parse transactions");
  }

  return z
    .array(TransactionItemAISchema)
    .parse(parsedResult)
    .map((tx) => ({
      ...tx,
      description: sanitizeHtml(tx.description, {
        allowedTags: [],
        allowedAttributes: {},
      }),
    }));
};

type CreateTransactionsInput = Omit<TransactionInputType, "template" | "templateId"> & {
  schedule?: ScheduledTransactionInput;
};

export const createTransactions = async (data: Array<CreateTransactionsInput>) => {
  const transactions = await Promise.all(
    data.map(({ schedule, ...transaction }) =>
      schedule ? createScheduledTransaction(transaction, schedule) : createTransaction(transaction),
    ),
  );

  return { count: transactions.length };
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
          isActive: true,
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
  return { ...transaction, amount: transaction.amount.toNumber() };
};

export const deleteTransaction = async (id: string) => {
  await getDb().transaction.delete({ where: { id } });
};
