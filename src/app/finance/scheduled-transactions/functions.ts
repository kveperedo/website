import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  CreateScheduledTransactionInputSchema,
  UpdateScheduledTransactionInputSchema,
} from "@/schema/scheduled-transaction";

import { authMiddleware } from "../../auth/middleware";
import { createRateLimitMiddleware } from "../../infra/rate-limit/middleware";
import {
  deleteScheduledTransactionTemplate,
  getScheduledExpensesForCurrentMonth,
  getScheduledTransactionTemplateById,
  getScheduledTransactionTemplates,
  getUpcomingScheduledTransactionTemplates,
  createScheduledTransactionTemplate,
  toggleScheduledTransactionTemplate,
  updateScheduledTransactionTemplate,
} from "./server";

export const getScheduledTransactionTemplatesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getScheduledTransactionTemplates();
  });

export const getUpcomingScheduledTransactionTemplatesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getUpcomingScheduledTransactionTemplates();
  });

export const toggleScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(z.uuid())
  .handler(async ({ data }) => {
    return await toggleScheduledTransactionTemplate(data);
  });

export const createScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(CreateScheduledTransactionInputSchema)
  .handler(async ({ data }) => {
    return await createScheduledTransactionTemplate(data.id, data.schedule);
  });

export const deleteScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(z.uuid())
  .handler(async ({ data }) => {
    return await deleteScheduledTransactionTemplate(data);
  });

export const getScheduledTransactionTemplateByIdFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.uuid())
  .handler(async ({ data }) => {
    return await getScheduledTransactionTemplateById(data);
  });

export const updateScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(UpdateScheduledTransactionInputSchema)
  .handler(async ({ data }) => {
    return await updateScheduledTransactionTemplate(data.id, data.data);
  });

export const getScheduledExpensesForCurrentMonthFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getScheduledExpensesForCurrentMonth();
  });
