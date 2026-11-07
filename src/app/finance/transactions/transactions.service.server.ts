import { waitUntil } from "cloudflare:workers";

import type { ScheduledTransactionInput } from "@/app/finance/scheduled/scheduled.schema";
import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";
import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { withTransaction } from "@/app/infra/database/client.server";

import { createScheduledTransaction } from "../scheduled/scheduled.service.server";
import {
  getCurrentMonthRange,
  startOfLocalMonth,
  startOfNextLocalMonth,
} from "../shared/local-date";
import {
  embedTransactionDescriptions,
  normalizeTransactionDescription,
  upsertTransactionMemories,
} from "./transactions.memory.repository.server";
import {
  createManyTransactions,
  createTransaction,
  deleteTransactionById,
  findRecentTransactions,
  findTransactionById,
  findTransactionsByMonth,
  updateTransaction as updateTransactionRecord,
} from "./transactions.repository.server";

const RECENT_TRANSACTIONS_LIMIT = 10;
/** Stays under the 30s Workers allow `waitUntil` work to run after the response. */
const MEMORY_UPDATE_TIMEOUT_MS = 20_000;

export const getRecentTransactions = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  return await findRecentTransactions({
    monthStart,
    monthEnd,
    limit: RECENT_TRANSACTIONS_LIMIT,
  });
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
  const monthEnd = startOfNextLocalMonth(year, month);

  return await findTransactionsByMonth({ monthStart, monthEnd, q, type, categories });
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
  if (data.every(({ schedule }) => !schedule)) {
    const result = await withTransaction((tx) =>
      createManyTransactions(
        tx,
        data.map(({ schedule: _schedule, ...transaction }) => transaction),
      ),
    );

    rememberTransactionsInBackground(data);

    return { count: result.count };
  }

  await withTransaction(async (tx) => {
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
  return await findTransactionById(id);
};

export const updateTransaction = async (id: string, data: TransactionInputType) => {
  const transaction = await updateTransactionRecord(id, data);

  rememberTransactionsInBackground([
    {
      description: data.description,
      type: data.type,
      category: data.type === "income" ? null : (data.category ?? null),
    },
  ]);

  return transaction;
};

export const deleteTransaction = async (id: string) => {
  await deleteTransactionById(id);
};
