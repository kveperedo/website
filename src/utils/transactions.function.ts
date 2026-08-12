import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { TransactionInputSchema } from "@/generated/zod/schemas";
import { CreateTransactionsInputSchema } from "@/schema/transaction";

import { authMiddleware } from "./auth.middleware";
import { createRateLimitMiddleware } from "./rate-limit.middleware";
import {
  createTransactions,
  deleteTransaction,
  getCategorySummary,
  getCategoryTrends,
  getMonthlyHistory,
  getMonthlySummary,
  getRecentTransactions,
  getTransactionById,
  getTransactionsByMonth,
  parseTransactions,
  updateTransaction,
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

export const getMonthlyHistoryFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getMonthlyHistory();
  });

export const getCategorySummaryFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getCategorySummary();
  });

export const getCategoryTrendsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getCategoryTrends();
  });

export const getTransactionsByMonthFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      q: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    return await getTransactionsByMonth(data.year, data.month, data.q);
  });

export const parseTransactionWithAIFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(
    z.object({
      text: z.string().max(1000, "Input too long — max 1000 characters"),
      localDate: z.iso.date(),
    }),
  )
  .handler(async ({ data }) => {
    return await parseTransactions(data.text, data.localDate);
  });

export const createTransactionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(CreateTransactionsInputSchema)
  .handler(async ({ data }) => {
    return await createTransactions(data);
  });

export const getTransactionByIdFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.uuid())
  .handler(async ({ data }) => {
    return await getTransactionById(data);
  });

export const updateTransactionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(
    z.object({
      id: z.uuid(),
      data: TransactionInputSchema,
    }),
  )
  .handler(async ({ data }) => {
    return await updateTransaction(data.id, data.data);
  });

export const deleteTransactionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(z.uuid())
  .handler(async ({ data }) => {
    return await deleteTransaction(data);
  });
