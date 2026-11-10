import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "../../auth/auth.middleware";
import { monthQuerySchema } from "../shared/month-query.schema";
import { getFinanceDashboard, getMonthlySummaryByMonth } from "./analytics.service.server";

export const getMonthlySummaryByMonthFn = createServerFn()
  .middleware([authMiddleware])
  .validator(monthQuerySchema)
  .handler(async ({ data }) => {
    return await getMonthlySummaryByMonth(data);
  });

export const getFinanceDashboardFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => getFinanceDashboard());
