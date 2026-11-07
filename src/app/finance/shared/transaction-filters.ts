import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

export type TransactionFilters = {
  q?: string;
  type?: TransactionType;
  categories?: Array<TransactionCategory>;
};

export const buildTransactionFilters = ({ q, type, categories }: TransactionFilters) => ({
  ...(q ? { description: { contains: q, mode: "insensitive" as const } } : {}),
  ...(type ? { type } : {}),
  ...(categories?.length ? { category: { in: categories } } : {}),
});
