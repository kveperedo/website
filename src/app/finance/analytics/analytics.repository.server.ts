import type { TransactionCategory } from "@/generated/prisma/enums";
import type { TransactionType } from "@/generated/zod/schemas/enums/TransactionType.schema";

import { getDb } from "@/app/infra/database/client.server";
import { TIME_ZONE } from "@/lib/date-only";

import { buildTransactionFilters, type TransactionFilters } from "../shared/transaction-filters";

type DateRange = {
  monthStart: Date;
  monthEnd: Date;
};

export type DailyTransactionTypeTotal = {
  day: string;
  type: TransactionType;
  total: number;
  count: number;
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

export const findDailyTransactionTypeTotals = async ({ monthStart, monthEnd }: DateRange) => {
  return await getDb().$queryRaw<Array<DailyTransactionTypeTotal>>`
    SELECT
      TO_CHAR("transacted_at" AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS day,
      type,
      SUM(amount)::float AS total,
      COUNT(*)::int AS count
    FROM transactions
    WHERE "transacted_at" >= ${monthStart}
      AND "transacted_at" < ${monthEnd}
    GROUP BY day, type
    ORDER BY day ASC
  `;
};

export const findMonthlyTransactionCategoryTotals = async ({ monthStart, monthEnd }: DateRange) => {
  return await getDb().$queryRaw<
    Array<{ month: string; category: TransactionCategory; total: number }>
  >`
    SELECT
      TO_CHAR("transacted_at" AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM') AS month,
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
