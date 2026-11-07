import type { TransactionCategory } from "@/generated/prisma/enums";

export type CategoryTrendRow = { month: string } & Record<TransactionCategory, number>;

export type MonthlyHistoryEntry = {
  label: string;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  isCurrentMonth: boolean;
};

export type MonthlyHistory = {
  current: MonthlyHistoryEntry;
  prior: Array<MonthlyHistoryEntry>;
  averagePriorExpenses: number | null;
  priorMonthCount: number;
};

export type MonthlyNetEntry = {
  month: string;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  isCurrentMonth: boolean;
};
