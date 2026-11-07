import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  CreateScheduledTransactionInputSchema,
  CreateStandaloneScheduledTemplateInputSchema,
  UpdateScheduledTransactionInputSchema,
} from "@/app/finance/scheduled/scheduled.schema";

import { authMiddleware } from "../../auth/auth.middleware";
import { createRateLimitMiddleware } from "../../infra/rate-limit/rate-limit.middleware";
import {
  archiveScheduledTransactionTemplate,
  createStandaloneScheduledTransactionTemplate,
  getArchivedScheduledTransactionTemplates,
  getArchivedScheduledTransactionTemplatesCount,
  getScheduledExpensesForCurrentMonth,
  getScheduledTransactionTemplateById,
  getScheduledTransactionTemplates,
  getUpcomingScheduledTransactionTemplates,
  createScheduledTransactionTemplate,
  toggleScheduledTransactionTemplate,
  updateScheduledTransactionTemplate,
} from "./scheduled.service.server";

export const getScheduledTransactionTemplatesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getScheduledTransactionTemplates);

export const getUpcomingScheduledTransactionTemplatesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getUpcomingScheduledTransactionTemplates);

export const toggleScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await toggleScheduledTransactionTemplate(data);
  });

export const createScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(CreateScheduledTransactionInputSchema)
  .handler(async ({ data }) => {
    return await createScheduledTransactionTemplate(data.id, data.schedule);
  });

export const archiveScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await archiveScheduledTransactionTemplate(data);
  });

export const getArchivedScheduledTransactionTemplatesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getArchivedScheduledTransactionTemplates);

export const getArchivedScheduledTransactionTemplatesCountFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getArchivedScheduledTransactionTemplatesCount);

export const getScheduledTransactionTemplateByIdFn = createServerFn()
  .middleware([authMiddleware])
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await getScheduledTransactionTemplateById(data);
  });

export const updateScheduledTransactionTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(UpdateScheduledTransactionInputSchema)
  .handler(async ({ data }) => {
    return await updateScheduledTransactionTemplate(data.id, data.data);
  });

export const getScheduledExpensesForCurrentMonthFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getScheduledExpensesForCurrentMonth);

export const createStandaloneScheduledTemplateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(CreateStandaloneScheduledTemplateInputSchema)
  .handler(async ({ data }) => {
    return await createStandaloneScheduledTransactionTemplate(data);
  });
