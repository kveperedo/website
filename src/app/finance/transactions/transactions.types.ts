import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

/** What the frontend parsed locally and hands over for a type and category. */
export type TransactionToClassify = {
  description: string;
  amount: number | null;
  transactedAt: string;
};

export type TransactionClassification = {
  type: TransactionType;
  category: TransactionCategory | null;
};
