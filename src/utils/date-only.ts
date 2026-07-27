export const dateOnlyToDatabaseDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};

export const databaseDateToDateOnly = (date: Date) => {
  return date.toISOString().slice(0, 10);
};
