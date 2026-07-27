import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { getDb } from "@/db/client";

export const DESCRIPTION_MAX_LENGTH = 200;

type CreateTransactionInput = Omit<TransactionInputType, "template">;

export const createTransaction = async (data: CreateTransactionInput) => {
  const transaction = await getDb().transaction.create({
    data: {
      description: data.description.slice(0, DESCRIPTION_MAX_LENGTH),
      amount: data.amount,
      type: data.type,
      category: data.category ?? undefined,
      transactedAt: data.transactedAt,
      templateId: data.templateId ?? undefined,
    },
  });

  return {
    ...transaction,
    amount: transaction.amount.toNumber(),
  };
};
