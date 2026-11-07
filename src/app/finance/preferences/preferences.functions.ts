import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { TransactionCategory } from "@/generated/prisma/enums";

import { authMiddleware } from "../../auth/auth.middleware";
import { createRateLimitMiddleware } from "../../infra/rate-limit/rate-limit.middleware";
import {
  getFinancePreferences,
  setCategoryTrendsVisibleCategories,
  setHideSummaryCardAmounts,
} from "./preferences.service.server";

export const getFinancePreferencesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getFinancePreferences);

export const setCategoryTrendsVisibleCategoriesFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware({ limit: 120, keyPrefix: "preferences" })])
  .validator(z.array(z.enum(TransactionCategory)))
  .handler(async ({ data }) => {
    await setCategoryTrendsVisibleCategories(data);
  });

export const setHideSummaryCardAmountsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware({ limit: 120, keyPrefix: "preferences" })])
  .validator(z.boolean())
  .handler(async ({ data }) => {
    await setHideSummaryCardAmounts(data);
  });
