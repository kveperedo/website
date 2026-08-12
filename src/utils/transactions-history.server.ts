import { getDaysInMonth, subMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { getDb } from "@/db/client";

import { TIME_ZONE } from "./local-date";

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
  const db = getDb();

  const results = await Promise.all(
    ranges.map(async (range) => {
      const grouped = await db.transaction.groupBy({
        by: ["type"],
        where: {
          transactedAt: { gte: range.monthStart, lt: range.monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      });

      const income = Number(grouped.find((g) => g.type === "income")?._sum.amount ?? 0);
      const expenses = Number(grouped.find((g) => g.type === "expense")?._sum.amount ?? 0);
      const transactionCount = grouped.reduce((sum, g) => sum + g._count, 0);

      return {
        label: range.label,
        income,
        expenses,
        net: income - expenses,
        transactionCount,
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
