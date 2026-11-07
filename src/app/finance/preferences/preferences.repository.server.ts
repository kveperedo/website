import { getDb } from "@/app/infra/database/client.server";
import { TransactionCategory } from "@/generated/prisma/enums";

const FINANCE_PREFERENCES_ID = "default";

export const findFinancePreferences = async () => {
  return await getDb().financePreferences.findUnique({
    where: { id: FINANCE_PREFERENCES_ID },
    select: {
      categoryTrendsVisibleCategories: true,
      hideSummaryCardAmounts: true,
    },
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

export const upsertHideSummaryCardAmounts = async (hideSummaryCardAmounts: boolean) => {
  await getDb().financePreferences.upsert({
    where: { id: FINANCE_PREFERENCES_ID },
    create: {
      id: FINANCE_PREFERENCES_ID,
      hideSummaryCardAmounts,
      // A missing preference means "all categories visible", so seed that instead of the
      // empty-array default, which the trends card interprets as "none selected".
      categoryTrendsVisibleCategories: Object.values(TransactionCategory),
    },
    update: { hideSummaryCardAmounts },
  });
};
