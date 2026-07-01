import { Agent, run, tool } from "@openai/agents";
import { addMonths, startOfMonth } from "date-fns";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { db } from "#/db/client";
import { TransactionCategorySchema } from "#/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "#/generated/zod/schemas/enums/TransactionType.schema";

export const parsedTransactionSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive("Amount must be positive").max(10_000_000),
  type: TransactionTypeSchema,
  category: TransactionCategorySchema.nullable(),
  date: z.iso.datetime(),
});

export type ParsedTransaction = z.infer<typeof parsedTransactionSchema>;

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

export const parseTransactions = async (text: string): Promise<Array<ParsedTransaction>> => {
  let parsedResult: Array<ParsedTransaction> | null = null;

  const today = new Date().toISOString().split("T")[0];

  const transactionItemSchema = z.object({
    description: z
      .string()
      .min(1)
      .max(200)
      .describe(
        "Clean, concise transaction description. Remove raw numbers (amount field captures them). Keep natural but short. Preserve merchant/vendor names when present.",
      ),
    amount: z
      .number()
      .positive("Amount must be positive")
      .max(10_000_000)
      .describe("Transaction amount as a positive number."),
    type: TransactionTypeSchema.describe(
      "Whether this is an expense or income. Default to expense if unclear.",
    ),
    category: TransactionCategorySchema.nullable().describe(
      "Best matching category. Options: food_drinks (meals, coffee, snacks, delivery), groceries_household (supermarket, toiletries, cleaning), transportation (fuel, parking, rideshare, transit), bills_utilities (electricity, water, internet, phone, rent, subscriptions), health_wellness (medicine, doctor, gym, vitamins), hobbies_lifestyle (entertainment, shopping, personal care, travel, gifts), financial (transfers, bank fees, investments, loan payments). Use null only when completely ambiguous (e.g. 'payment 500').",
    ),
    date: z
      .string()
      .date()
      .describe(
        `Transaction date in YYYY-MM-DD format. Use today (${today}) if no date is mentioned. Resolve relative dates: "yesterday" → subtract 1 day, "last Monday" → most recent Monday. If a date applies to multiple transactions on different lines, use the date from that line. If no date on a line, inherit from the previous transaction.`,
      ),
  });

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
        .array(transactionItemSchema)
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
    .array(transactionItemSchema)
    .parse(parsedResult)
    .map((tx) => ({
      ...tx,
      description: sanitizeHtml(tx.description, {
        allowedTags: [],
        allowedAttributes: {},
      }),
    }));
};

export const createTransaction = async (data: ParsedTransaction) => {
  const transaction = await db.transaction.create({
    data: {
      description: data.description.slice(0, 200),
      amount: data.amount,
      type: data.type,
      category: data.category ?? undefined,
      transactedAt: new Date(data.date),
    },
  });

  return {
    ...transaction,
    amount: transaction.amount.toNumber(),
  };
};

export const createTransactions = async (data: Array<ParsedTransaction>) => {
  return db.transaction.createMany({
    data: data.map((item) => ({
      description: item.description.slice(0, 200),
      amount: item.amount,
      type: item.type,
      category: item.category ?? undefined,
      transactedAt: new Date(item.date),
    })),
  });
};
