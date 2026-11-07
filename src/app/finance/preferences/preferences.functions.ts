import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { TransactionCategory } from "@/generated/prisma/enums";

import { authMiddleware } from "../../auth/auth.middleware";
import { createRateLimitMiddleware } from "../../infra/rate-limit/rate-limit.middleware";
import {
  getCategoryTrendsVisibleCategories,
  setCategoryTrendsVisibleCategories,
} from "./preferences.service.server";

export const getCategoryTrendsVisibleCategoriesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getCategoryTrendsVisibleCategories);

export const setCategoryTrendsVisibleCategoriesFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware({ limit: 120, keyPrefix: "preferences" })])
  .validator(z.array(z.enum(TransactionCategory)))
  .handler(async ({ data }) => {
    await setCategoryTrendsVisibleCategories(data);
  });
