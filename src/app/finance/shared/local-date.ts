import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { TIME_ZONE } from "@/lib/date-only";

export const getCurrentYearMonth = (now = new Date()) => {
  const zoned = toZonedTime(now, TIME_ZONE);
  return { year: zoned.getFullYear(), month: zoned.getMonth() + 1 };
};

export const startOfLocalMonth = (year: number, month: number) => {
  return fromZonedTime(new Date(year, month - 1, 1), TIME_ZONE);
};

export const startOfNextLocalMonth = (year: number, month: number) => {
  return fromZonedTime(new Date(year, month, 1), TIME_ZONE);
};

export const getCurrentMonthRange = (now = new Date()) => {
  const { year, month } = getCurrentYearMonth(now);
  return {
    monthStart: startOfLocalMonth(year, month),
    monthEnd: startOfNextLocalMonth(year, month),
  };
};
