import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "../../auth/auth.middleware";
import { monthQuerySchema } from "../shared/month-query.schema";
import {
  getCategorySummary,
  getCategoryTrends,
  getMonthlyHistory,
  getMonthlyNet,
  getMonthlySummaryByMonth,
} from "./analytics.service.server";

export const getMonthlySummaryByMonthFn = createServerFn()
  .middleware([authMiddleware])
  .validator(monthQuerySchema)
  .handler(async ({ data }) => {
    return await getMonthlySummaryByMonth(data);
  });

export const getMonthlyHistoryFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getMonthlyHistory();
  });

export const getMonthlyNetFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getMonthlyNet();
  });

export const getCategorySummaryFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getCategorySummary);

export const getCategoryTrendsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getCategoryTrends);
