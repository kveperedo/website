import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { getDb, type DbTransactionClient } from "@/app/infra/database/client.server";

import { databaseDateToDateOnly } from "../shared/local-date";
import { buildTransactionFilters, type TransactionFilters } from "../shared/transaction-filters";

type DateRange = {
  monthStart: Date;
  monthEnd: Date;
};

type TransactionRow = { amount: { toNumber(): number } };

const toDomain = <T extends TransactionRow>(transaction: T) => ({
  ...transaction,
  amount: transaction.amount.toNumber(),
});

export const findRecentTransactions = async ({
  monthStart,
  monthEnd,
  limit,
}: DateRange & { limit: number }) => {
  const transactions = await getDb().transaction.findMany({
    where: { transactedAt: { gte: monthStart, lt: monthEnd } },
    orderBy: [{ transactedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return transactions.map(toDomain);
};

export const findTransactionsByMonth = async ({
  monthStart,
  monthEnd,
  q,
  type,
  categories,
}: DateRange & TransactionFilters) => {
  const transactions = await getDb().transaction.findMany({
    where: {
      transactedAt: { gte: monthStart, lt: monthEnd },
      ...buildTransactionFilters({ q, type, categories }),
    },
    orderBy: [{ transactedAt: "desc" }, { createdAt: "desc" }],
  });

  return transactions.map(toDomain);
};

export const findTransactionById = async (id: string) => {
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

export type CreateTransactionInput = Omit<TransactionInputType, "template">;

export const createTransaction = async (db: DbTransactionClient, data: CreateTransactionInput) => {
  const transaction = await db.transaction.create({
    data: {
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category ?? undefined,
      transactedAt: data.transactedAt,
      templateId: data.templateId ?? undefined,
    },
  });

  return toDomain(transaction);
};

export type CreateManyTransactionsInput = Omit<TransactionInputType, "template" | "templateId">;

export const createManyTransactions = async (
  db: DbTransactionClient,
  data: Array<CreateManyTransactionsInput>,
) => {
  const result = await db.transaction.createMany({
    data: data.map((transaction) => ({
      ...transaction,
      category: transaction.category ?? undefined,
    })),
  });

  return { count: result.count };
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

  return toDomain(transaction);
};

export const deleteTransactionById = async (id: string) => {
  await getDb().transaction.delete({ where: { id } });
};

export const findTransactionForScheduling = async (db: DbTransactionClient, id: string) => {
  return await db.transaction.findUniqueOrThrow({ where: { id } });
};

export const attachTemplateToTransaction = async (
  db: DbTransactionClient,
  id: string,
  templateId: string,
) => {
  return await db.transaction.updateMany({
    where: { id, templateId: null },
    data: { templateId },
  });
};

export const countTransactionsByTemplate = async (db: DbTransactionClient, templateId: string) => {
  return await db.transaction.count({ where: { templateId } });
};

export const findTransactionByTemplateInRange = async (
  db: DbTransactionClient,
  templateId: string,
  { monthStart, monthEnd }: DateRange,
) => {
  return await db.transaction.findFirst({
    where: {
      templateId,
      transactedAt: { gte: monthStart, lt: monthEnd },
    },
  });
};
