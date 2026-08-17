import type { DbTransactionClient } from "@/db/client";
import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

type CreateTransactionInput = Omit<TransactionInputType, "template">;

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

  return {
    ...transaction,
    amount: transaction.amount.toNumber(),
  };
};
