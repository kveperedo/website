import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { getDb } from "@/db/client";

type CreateTransactionInput = Omit<TransactionInputType, "template">;

export const createTransaction = async (data: CreateTransactionInput) => {
  const transaction = await getDb().transaction.create({
    data: {
      description: data.description,
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
