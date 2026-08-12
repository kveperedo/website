import type { TransactionCategory } from "@/generated/prisma/enums";

import { getDb } from "@/db/client";

const FINANCE_PREFERENCES_ID = "default";

export const getCategoryTrendsVisibleCategories =
  async (): Promise<Array<TransactionCategory> | null> => {
    const preferences = await getDb().financePreferences.findUnique({
      where: { id: FINANCE_PREFERENCES_ID },
      select: { categoryTrendsVisibleCategories: true },
    });

    return preferences?.categoryTrendsVisibleCategories ?? null;
  };

export const setCategoryTrendsVisibleCategories = async (
  categories: Array<TransactionCategory>,
): Promise<void> => {
  await getDb().financePreferences.upsert({
    where: { id: FINANCE_PREFERENCES_ID },
    create: { id: FINANCE_PREFERENCES_ID, categoryTrendsVisibleCategories: categories },
    update: { categoryTrendsVisibleCategories: categories },
  });
};
