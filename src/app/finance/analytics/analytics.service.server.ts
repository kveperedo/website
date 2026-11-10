import { getDaysInMonth, subMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { TransactionCategory } from "@/generated/prisma/enums";
import { databaseDateToDateOnly, TIME_ZONE } from "@/lib/date-only";

import type { TransactionFilters } from "../shared/transaction-filters";
import type { CategoryTrendRow, FinanceDashboard, MonthlyNetEntry } from "./analytics.types";

import {
  getCurrentYearMonth,
  startOfLocalMonth,
  startOfNextLocalMonth,
} from "../shared/local-date";
import {
  findDailyTransactionTypeTotals,
  findMonthlyTransactionCategoryTotals,
  sumTransactionAmountsByTypeInRange,
  type DailyTransactionTypeTotal,
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

const ALL_CATEGORIES = Object.values(TransactionCategory);

const emptyMonth = (): Record<TransactionCategory, number> =>
  Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0])) as Record<TransactionCategory, number>;

type MonthlyCategoryTotal = {
  month: string;
  category: TransactionCategory;
  total: number;
};

const toCategoryTrends = (rows: Array<MonthlyCategoryTotal>): Array<CategoryTrendRow> =>
  rows.reduce<Array<CategoryTrendRow>>((result, row) => {
    const last = result[result.length - 1];
    if (last?.month === row.month) {
      last[row.category] = row.total;
    } else {
      result.push({ month: row.month, ...emptyMonth(), [row.category]: row.total });
    }
    return result;
  }, []);

const toCategorySummary = (rows: Array<MonthlyCategoryTotal>, currentMonth: string) =>
  rows
    .filter((row) => row.month === currentMonth)
    .map((row) => ({ category: row.category, total: row.total }))
    .sort((a, b) => b.total - a.total);

const getPartialMonthRanges = (historyMonths: number, now = new Date()) => {
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

type TypeSummary = { income: number; expenses: number; transactionCount: number };

const sumDailyTotals = (
  totals: Array<DailyTransactionTypeTotal>,
  monthStart: Date,
  monthEnd: Date,
): TypeSummary => {
  const start = databaseDateToDateOnly(monthStart);
  const end = databaseDateToDateOnly(monthEnd);
  let income = 0;
  let expenses = 0;
  let transactionCount = 0;

  for (const total of totals) {
    if (total.day < start || total.day >= end) {
      continue;
    }
    transactionCount += total.count;
    if (total.type === "income") {
      income += total.total;
    } else if (total.type === "expense") {
      expenses += total.total;
    }
  }

  return { income, expenses, transactionCount };
};

const toHistory = (
  totals: Array<DailyTransactionTypeTotal>,
  ranges: ReturnType<typeof getPartialMonthRanges>,
) => {
  const results = ranges.map((range) => {
    const summary = sumDailyTotals(totals, range.monthStart, range.monthEnd);

    return {
      label: range.label,
      income: summary.income,
      expenses: summary.expenses,
      net: summary.income - summary.expenses,
      transactionCount: summary.transactionCount,
      isCurrentMonth: range.isCurrentMonth,
    };
  });

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
const TREND_MONTHS = 6;
const HISTORY_MONTHS = 3;

const monthlyNetRanges = (now: Date) => {
  const { year, month } = getCurrentYearMonth(now);
  const zonedNow = toZonedTime(now, TIME_ZONE);
  const currentDayEnd = fromZonedTime(new Date(year, month - 1, zonedNow.getDate() + 1), TIME_ZONE);

  return Array.from({ length: MONTHLY_NET_MONTHS }, (_, index) => {
    const monthOffset = index - (MONTHLY_NET_MONTHS - 1);
    const monthStart = startOfLocalMonth(year, month + monthOffset);
    const isCurrentMonth = monthOffset === 0;
    const monthEnd = isCurrentMonth
      ? currentDayEnd
      : startOfNextLocalMonth(year, month + monthOffset);

    return { monthStart, monthEnd, isCurrentMonth };
  });
};

const toMonthlyNet = (
  totals: Array<DailyTransactionTypeTotal>,
  ranges: ReturnType<typeof monthlyNetRanges>,
): Array<MonthlyNetEntry> => {
  const monthlyNet = ranges.map((range) => {
    const summary = sumDailyTotals(totals, range.monthStart, range.monthEnd);

    return {
      month: formatInTimeZone(range.monthStart, TIME_ZONE, "yyyy-MM"),
      income: summary.income,
      expenses: summary.expenses,
      net: summary.income - summary.expenses,
      transactionCount: summary.transactionCount,
      isCurrentMonth: range.isCurrentMonth,
    };
  });

  return monthlyNet.some((month) => month.transactionCount > 0) ? monthlyNet : [];
};

export const getFinanceDashboard = async (now = new Date()): Promise<FinanceDashboard> => {
  const { year, month } = getCurrentYearMonth(now);
  const dashboardMonthStart = startOfLocalMonth(
    year,
    month - (Math.max(TREND_MONTHS, MONTHLY_NET_MONTHS) - 1),
  );
  const netRanges = monthlyNetRanges(now);
  const currentDayEnd = netRanges[netRanges.length - 1]!.monthEnd;
  const currentMonth = formatInTimeZone(startOfLocalMonth(year, month), TIME_ZONE, "yyyy-MM");

  // Month-to-date like the summary card, so transactions dated later this month don't count.
  const dailyTotals = await findDailyTransactionTypeTotals({
    monthStart: dashboardMonthStart,
    monthEnd: currentDayEnd,
  });
  const categoryRows = await findMonthlyTransactionCategoryTotals({
    monthStart: dashboardMonthStart,
    monthEnd: currentDayEnd,
  });

  return {
    categorySummary: toCategorySummary(categoryRows, currentMonth),
    categoryTrends: toCategoryTrends(categoryRows),
    history: toHistory(dailyTotals, getPartialMonthRanges(HISTORY_MONTHS, now)),
    monthlyNet: toMonthlyNet(dailyTotals, netRanges),
  };
};
