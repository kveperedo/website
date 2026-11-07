import type { TransactionCategory } from "@/generated/prisma/enums";

import { getDb } from "@/app/infra/database/client.server";

import { buildTransactionFilters, type TransactionFilters } from "../shared/transaction-filters";

type DateRange = {
  monthStart: Date;
  monthEnd: Date;
};

export type TransactionTypeSummary = {
  income: number;
  expenses: number;
  transactionCount: number;
};

export const sumTransactionAmountsByTypeInRange = async ({
  monthStart,
  monthEnd,
  filters,
}: DateRange & { filters?: TransactionFilters }): Promise<TransactionTypeSummary> => {
  const grouped = await getDb().transaction.groupBy({
    by: ["type"],
    where: {
      transactedAt: { gte: monthStart, lt: monthEnd },
      ...buildTransactionFilters(filters ?? {}),
    },
    _sum: { amount: true },
    _count: true,
  });

  const income = Number(grouped.find((g) => g.type === "income")?._sum.amount ?? 0);
  const expenses = Number(grouped.find((g) => g.type === "expense")?._sum.amount ?? 0);
  const transactionCount = grouped.reduce((sum, g) => sum + g._count, 0);

  return { income, expenses, transactionCount };
};

export const sumTransactionAmountsByCategoryInRange = async ({
  monthStart,
  monthEnd,
}: DateRange) => {
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

export const findMonthlyTransactionCategoryTotals = async ({ monthStart, monthEnd }: DateRange) => {
  return await getDb().$queryRaw<
    Array<{ month: string; category: TransactionCategory; total: number }>
  >`
    SELECT
      TO_CHAR("transacted_at", 'YYYY-MM') AS month,
      category,
      SUM(amount)::float AS total
    FROM transactions
    WHERE "transacted_at" >= ${monthStart}
      AND "transacted_at" < ${monthEnd}
      AND type = 'expense'
      AND category IS NOT NULL
    GROUP BY month, category
    ORDER BY month ASC
  `;
};
