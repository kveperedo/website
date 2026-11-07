import { getDaysInMonth, subMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { TransactionCategory } from "@/generated/prisma/enums";

import type { TransactionFilters } from "../shared/transaction-filters";
import type { CategoryTrendRow, MonthlyHistory, MonthlyNetEntry } from "./analytics.types";

import {
  getCurrentMonthRange,
  getCurrentYearMonth,
  startOfLocalMonth,
  startOfNextLocalMonth,
  TIME_ZONE,
} from "../shared/local-date";
import {
  findMonthlyTransactionCategoryTotals,
  sumTransactionAmountsByCategoryInRange,
  sumTransactionAmountsByTypeInRange,
} from "./analytics.repository.server";

type GetMonthlySummaryInput = {
  year: number;
  month: number;
} & TransactionFilters;

export const getMonthlySummaryByMonth = async ({
  year,
  month,
  q,
  type,
  categories,
}: GetMonthlySummaryInput) => {
  const monthStart = startOfLocalMonth(year, month);
  const monthEnd = startOfNextLocalMonth(year, month);

  return await sumTransactionAmountsByTypeInRange({
    monthStart,
    monthEnd,
    filters: { q, type, categories },
  });
};

export const getCategorySummary = async () => {
  const { monthStart, monthEnd } = getCurrentMonthRange();

  return await sumTransactionAmountsByCategoryInRange({ monthStart, monthEnd });
};

const ALL_CATEGORIES = Object.values(TransactionCategory);

const TREND_MONTHS = 6;

const emptyMonth = (): Record<TransactionCategory, number> =>
  Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0])) as Record<TransactionCategory, number>;

export const getCategoryTrends = async () => {
  const { year, month } = getCurrentYearMonth();
  const monthStart = startOfLocalMonth(year, month - (TREND_MONTHS - 1));
  const monthEnd = startOfNextLocalMonth(year, month);

  const rows = await findMonthlyTransactionCategoryTotals({ monthStart, monthEnd });

  return rows.reduce<Array<CategoryTrendRow>>((result, row) => {
    const last = result[result.length - 1];
    if (last?.month === row.month) {
      last[row.category] = row.total;
    } else {
      result.push({ month: row.month, ...emptyMonth(), [row.category]: row.total });
    }
    return result;
  }, []);
};

export const getPartialMonthRanges = (historyMonths: number) => {
  const now = new Date();
  const zonedNow = toZonedTime(now, TIME_ZONE);
  const year = zonedNow.getFullYear();
  const monthIndex = zonedNow.getMonth();
  const day = zonedNow.getDate();

  const ranges: Array<{
    monthStart: Date;
    monthEnd: Date;
    label: string;
    isCurrentMonth: boolean;
  }> = [];

  ranges.push({
    monthStart: fromZonedTime(new Date(year, monthIndex, 1), TIME_ZONE),
    monthEnd: fromZonedTime(new Date(year, monthIndex, day + 1), TIME_ZONE),
    label: formatInTimeZone(new Date(year, monthIndex, 1), TIME_ZONE, "MMMM yyyy"),
    isCurrentMonth: true,
  });

  for (let i = 1; i <= historyMonths; i++) {
    const target = subMonths(zonedNow, i);
    const targetYear = target.getFullYear();
    const targetMonth = target.getMonth();
    const daysInTargetMonth = getDaysInMonth(target);
    const effectiveDay = Math.min(day, daysInTargetMonth);

    ranges.push({
      monthStart: fromZonedTime(new Date(targetYear, targetMonth, 1), TIME_ZONE),
      monthEnd: fromZonedTime(new Date(targetYear, targetMonth, effectiveDay + 1), TIME_ZONE),
      label: formatInTimeZone(new Date(targetYear, targetMonth, 1), TIME_ZONE, "MMMM yyyy"),
      isCurrentMonth: false,
    });
  }

  return ranges;
};

export const getMonthlyHistory = async (historyMonths = 3): Promise<MonthlyHistory> => {
  const ranges = getPartialMonthRanges(historyMonths);

  const results = await Promise.all(
    ranges.map(async (range) => {
      const summary = await sumTransactionAmountsByTypeInRange({
        monthStart: range.monthStart,
        monthEnd: range.monthEnd,
      });

      return {
        label: range.label,
        income: summary.income,
        expenses: summary.expenses,
        net: summary.income - summary.expenses,
        transactionCount: summary.transactionCount,
        isCurrentMonth: range.isCurrentMonth,
      };
    }),
  );

  const current = results.find((r) => r.isCurrentMonth)!;
  const prior = results.filter((r) => !r.isCurrentMonth);
  const priorWithData = prior.filter((r) => r.transactionCount > 0);

  const averagePriorExpenses =
    priorWithData.length > 0
      ? priorWithData.reduce((sum, r) => sum + r.expenses, 0) / priorWithData.length
      : null;

  return {
    current,
    prior,
    averagePriorExpenses,
    priorMonthCount: priorWithData.length,
  };
};

const MONTHLY_NET_MONTHS = 6;

export const getMonthlyNet = async (now = new Date()): Promise<Array<MonthlyNetEntry>> => {
  const { year, month } = getCurrentYearMonth(now);
  const zonedNow = toZonedTime(now, TIME_ZONE);
  const currentDayEnd = fromZonedTime(new Date(year, month - 1, zonedNow.getDate() + 1), TIME_ZONE);

  const monthlyNet = await Promise.all(
    Array.from({ length: MONTHLY_NET_MONTHS }, async (_, index) => {
      const monthOffset = index - (MONTHLY_NET_MONTHS - 1);
      const monthStart = startOfLocalMonth(year, month + monthOffset);
      const isCurrentMonth = monthOffset === 0;
      const monthEnd = isCurrentMonth
        ? currentDayEnd
        : startOfNextLocalMonth(year, month + monthOffset);
      const summary = await sumTransactionAmountsByTypeInRange({ monthStart, monthEnd });

      return {
        month: formatInTimeZone(monthStart, TIME_ZONE, "yyyy-MM"),
        income: summary.income,
        expenses: summary.expenses,
        net: summary.income - summary.expenses,
        transactionCount: summary.transactionCount,
        isCurrentMonth,
      };
    }),
  );

  return monthlyNet.some((month) => month.transactionCount > 0) ? monthlyNet : [];
};
