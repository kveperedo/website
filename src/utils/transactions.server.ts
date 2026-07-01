import { Agent, run, tool } from "@openai/agents";
import { addMonths, startOfMonth } from "date-fns";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import type { TransactionInputType } from "#/generated/zod/schemas";

import { db } from "#/db/client";
import { TransactionItemAISchema, type TransactionItemAIType } from "#/schema/transaction";

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    monthStart: startOfMonth(now),
    monthEnd: startOfMonth(addMonths(now, 1)),
  };
};

export const getRecentTransactions = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  const transactions = await db.transaction.findMany({
    where: { transactedAt: { gte: monthStart, lt: monthEnd } },
    orderBy: { transactedAt: "desc" },
    take: 10,
  });

  return transactions.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
  }));
};

export const getMonthlySummary = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  const grouped = await db.transaction.groupBy({
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

  const grouped = await db.transaction.groupBy({
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

export const parseTransactions = async (text: string): Promise<Array<TransactionItemAIType>> => {
  let parsedResult: Array<TransactionItemAIType> | null = null;

  const today = new Date().toISOString().split("T")[0];

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
    instructions: `You are a transaction parser. Today's date is ${today}. Parse the user's input into structured transactions by calling the parse_transactions tool. Always call the tool even for a single transaction.`,
    tools: [parseTransactionsTool],
  });

  await run(agent, text);

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

export const createTransactions = async (data: Array<TransactionInputType>) =>
  db.transaction.createMany({
    data: data.map((item) => ({
      description: item.description.slice(0, 200),
      amount: item.amount,
      type: item.type,
      category: item.category ?? undefined,
      transactedAt: item.transactedAt,
    })),
  });
