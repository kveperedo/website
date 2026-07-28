import { Agent, run, tool } from "@openai/agents";
import { addMonths, startOfMonth } from "date-fns";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import type { ScheduledTransactionInput } from "@/schema/scheduled-transaction";

import { getDb } from "@/db/client";
import { TransactionItemAISchema, type TransactionItemAIType } from "@/schema/transaction";

import { databaseDateToDateOnly } from "./date-only";
import { createScheduledTransaction } from "./scheduled-transactions.server";
import { createTransaction } from "./transaction-creation.server";

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    monthStart: startOfMonth(now),
    monthEnd: startOfMonth(addMonths(now, 1)),
  };
};

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

export const getTransactionsByMonth = async (year: number, month: number, q?: string) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = addMonths(monthStart, 1);

  const transactions = await getDb().transaction.findMany({
    where: {
      transactedAt: { gte: monthStart, lt: monthEnd },
      ...(q ? { description: { contains: q, mode: "insensitive" } } : {}),
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
