import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { TransactionCategory } from "@/generated/prisma/enums";

import { authMiddleware } from "../../auth/middleware";
import { createRateLimitMiddleware } from "../../infra/rate-limit/middleware";
import { getCategoryTrendsVisibleCategories, setCategoryTrendsVisibleCategories } from "./server";

export const getCategoryTrendsVisibleCategoriesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getCategoryTrendsVisibleCategories();
  });

export const setCategoryTrendsVisibleCategoriesFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware({ limit: 120, keyPrefix: "preferences" })])
  .inputValidator(z.array(z.enum(TransactionCategory)))
  .handler(async ({ data }) => {
    await setCategoryTrendsVisibleCategories(data);
  });
