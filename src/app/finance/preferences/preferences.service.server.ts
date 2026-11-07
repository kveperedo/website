import type { TransactionCategory } from "@/generated/prisma/enums";

import {
  findCategoryTrendsVisibleCategories,
  upsertCategoryTrendsVisibleCategories,
} from "./preferences.repository.server";

export const getCategoryTrendsVisibleCategories =
  async (): Promise<Array<TransactionCategory> | null> => {
    const preferences = await findCategoryTrendsVisibleCategories();

    return preferences?.categoryTrendsVisibleCategories ?? null;
  };

export const setCategoryTrendsVisibleCategories = async (
  categories: Array<TransactionCategory>,
): Promise<void> => {
  await upsertCategoryTrendsVisibleCategories(categories);
};
