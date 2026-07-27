import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CreateScheduledTransactionInputSchema } from "@/schema/scheduled-transaction";

import { authMiddleware } from "./auth.middleware";
import { createRateLimitMiddleware } from "./rate-limit.middleware";
import {
  deleteScheduledTransactionTemplate,
  generateScheduledTransactions,
  getScheduledTransactionTemplates,
  getUpcomingScheduledTransactionTemplates,
  createScheduledTransactionTemplate,
  toggleScheduledTransactionTemplate,
} from "./scheduled-transactions.server";

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
  .inputValidator(z.string().uuid())
  .handler(async ({ data }) => {
    return await deleteScheduledTransactionTemplate(data);
  });

export const generateScheduledTransactionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .handler(async () => {
    return await generateScheduledTransactions();
  });
