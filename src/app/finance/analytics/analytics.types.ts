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

export type FinanceDashboard = {
  categorySummary: Array<{ category: TransactionCategory; total: number }>;
  categoryTrends: Array<CategoryTrendRow>;
  history: MonthlyHistory;
  monthlyNet: Array<MonthlyNetEntry>;
};

export type MonthlyNetEntry = {
  month: string;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  isCurrentMonth: boolean;
};
