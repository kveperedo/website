import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { TransactionInputSchema } from "#/generated/zod/schemas";

import { authMiddleware } from "./auth.middleware";
import { createRateLimitMiddleware } from "./rate-limit.middleware";
import {
  createTransactions,
  getCategorySummary,
  getMonthlySummary,
  getRecentTransactions,
  parseTransactions,
} from "./transactions.server";

export const getRecentTransactionsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getRecentTransactions();
  });

export const getMonthlySummaryFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getMonthlySummary();
  });

export const getCategorySummaryFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getCategorySummary();
  });

export const parseTransactionWithAIFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(z.string().max(1000, "Input too long — max 1000 characters"))
  .handler(async ({ data: text }) => {
    return await parseTransactions(text);
  });

export const createTransactionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(z.array(TransactionInputSchema))
  .handler(async ({ data }) => {
    return await createTransactions(data);
  });
