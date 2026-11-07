import type { TransactionCategory } from "@/generated/prisma/enums";

export type FinancePreferences = {
  /** `null` means no preference has been saved, so every category is visible. */
  categoryTrendsVisibleCategories: Array<TransactionCategory> | null;
  hideSummaryCardAmounts: boolean;
};
