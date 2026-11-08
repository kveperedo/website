import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const TIME_ZONE = "Asia/Manila";

export const formatLocal = (date: Date, formatStr: string) => {
  return formatInTimeZone(date, TIME_ZONE, formatStr);
};

export const dateOnlyToDatabaseDate = (date: string) => {
  // Noon in the app time zone keeps a date-only column from shifting across offsets.
  return fromZonedTime(`${date}T12:00:00`, TIME_ZONE);
};

export const databaseDateToDateOnly = (date: Date) => {
  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd");
};

export const todayDateOnly = () => {
  return formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
};
