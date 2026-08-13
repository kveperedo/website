import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const TIME_ZONE = "Asia/Manila";

export const formatLocal = (date: Date, formatStr: string) =>
  formatInTimeZone(date, TIME_ZONE, formatStr);

export const dateOnlyToDatabaseDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return fromZonedTime(new Date(year, month - 1, day, 12), TIME_ZONE);
};

export const databaseDateToDateOnly = (date: Date) => {
  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd");
};

export const getCurrentYearMonth = (now = new Date()) => {
  const zoned = toZonedTime(now, TIME_ZONE);
  return { year: zoned.getFullYear(), month: zoned.getMonth() + 1 };
};

export const todayDateOnly = () => {
  return formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
};

export const startOfLocalMonth = (year: number, month: number) => {
  return fromZonedTime(new Date(year, month - 1, 1), TIME_ZONE);
};

export const endOfLocalMonth = (year: number, month: number) => {
  return fromZonedTime(new Date(year, month, 1), TIME_ZONE);
};

export const getCurrentMonthRange = (now = new Date()) => {
  const { year, month } = getCurrentYearMonth(now);
  return {
    monthStart: startOfLocalMonth(year, month),
    monthEnd: endOfLocalMonth(year, month),
  };
};
