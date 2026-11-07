import type { TransactionCategory } from "@/generated/prisma/enums";

import type { FinancePreferences } from "./preferences.types";

import {
  findFinancePreferences,
  upsertCategoryTrendsVisibleCategories,
  upsertHideSummaryCardAmounts,
} from "./preferences.repository.server";

export const getFinancePreferences = async (): Promise<FinancePreferences> => {
  const preferences = await findFinancePreferences();

  return {
    categoryTrendsVisibleCategories: preferences?.categoryTrendsVisibleCategories ?? null,
    hideSummaryCardAmounts: preferences?.hideSummaryCardAmounts ?? false,
  };
};

export const setCategoryTrendsVisibleCategories = async (
  categories: Array<TransactionCategory>,
): Promise<void> => {
  await upsertCategoryTrendsVisibleCategories(categories);
};

export const setHideSummaryCardAmounts = async (hideSummaryCardAmounts: boolean): Promise<void> => {
  await upsertHideSummaryCardAmounts(hideSummaryCardAmounts);
};
