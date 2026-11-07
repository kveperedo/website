import type { TransactionCategory } from "@/generated/prisma/enums";

import { getDb } from "@/app/infra/database/client.server";

const FINANCE_PREFERENCES_ID = "default";

export const findCategoryTrendsVisibleCategories = async () => {
  return await getDb().financePreferences.findUnique({
    where: { id: FINANCE_PREFERENCES_ID },
    select: { categoryTrendsVisibleCategories: true },
  });
};

export const upsertCategoryTrendsVisibleCategories = async (
  categories: Array<TransactionCategory>,
) => {
  await getDb().financePreferences.upsert({
    where: { id: FINANCE_PREFERENCES_ID },
    create: { id: FINANCE_PREFERENCES_ID, categoryTrendsVisibleCategories: categories },
    update: { categoryTrendsVisibleCategories: categories },
  });
};
