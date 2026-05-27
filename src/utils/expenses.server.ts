import { db } from "#/db/client";

export const getExpenses = async () => {
  const expenses = await db.expense.findMany();

  return expenses.map((expense) => ({
    ...expense,
    amount: expense.amount.toNumber(),
  }));
};
