export type ExpenseProgressResult = {
  expensesPercent: number;
  projectedPercent: number;
  actualBarPercent: number;
  scheduledBarPercent: number;
  isOverIncome: boolean;
  isProjectedOverIncome: boolean;
};

export function getExpenseProgress(
  income: number,
  expenses: number,
  scheduledExpenses: number,
): ExpenseProgressResult {
  if (!Number.isFinite(income) || income <= 0) {
    return {
      expensesPercent: 0,
      projectedPercent: 0,
      actualBarPercent: 0,
      scheduledBarPercent: 0,
      isOverIncome: false,
      isProjectedOverIncome: false,
    };
  }
  const expensesRatio = expenses / income;
  const projectedExpenses = expenses + scheduledExpenses;
  const projectedRatio = projectedExpenses / income;
  // Multiply before dividing to avoid floating-point drift (e.g. (575/1000)*100 === 57.499999999999996).
  const expensesPercent = Number.isFinite(expensesRatio)
    ? Math.round((expenses * 100) / income)
    : 0;
  const projectedPercent = Number.isFinite(projectedRatio)
    ? Math.round((projectedExpenses * 100) / income)
    : 0;
  const deltaPercent = Math.max(projectedPercent - expensesPercent, 0);
  const actualBarPercent = Math.min(expensesPercent, 100);
  const scheduledBarPercent = Math.min(deltaPercent, 100 - actualBarPercent);
  return {
    expensesPercent,
    projectedPercent,
    actualBarPercent,
    scheduledBarPercent,
    isOverIncome: expensesRatio > 1,
    isProjectedOverIncome: projectedRatio > 1,
  };
}
