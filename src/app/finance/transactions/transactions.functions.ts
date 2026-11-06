import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  CreateTransactionsInputSchema,
  ParsedTransactionSchema,
} from "@/app/finance/transactions/transactions.schema";
import { TransactionInputSchema } from "@/generated/zod/schemas";

import { authMiddleware } from "../../auth/auth.middleware";
import { createRateLimitMiddleware } from "../../infra/rate-limit/rate-limit.middleware";
import { monthQuerySchema } from "../shared/month-query.schema";
import { classifyTransactions } from "./transactions.classification.server";
import {
  createTransactions,
  deleteTransaction,
  getRecentTransactions,
  getTransactionById,
  getTransactionsByMonth,
  updateTransaction,
} from "./transactions.service.server";

export const getRecentTransactionsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(getRecentTransactions);

export const getTransactionsByMonthFn = createServerFn()
  .middleware([authMiddleware])
  .validator(monthQuerySchema)
  .handler(async ({ data }) => {
    return await getTransactionsByMonth(data);
  });

/** Exactly the parsed transaction minus the two fields the composer has no opinion about yet. */
const TransactionToClassifySchema = ParsedTransactionSchema.pick({
  description: true,
  amount: true,
  transactedAt: true,
});

export const classifyTransactionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(z.object({ items: z.array(TransactionToClassifySchema).min(1).max(20) }))
  .handler(async ({ data }) => {
    return await classifyTransactions(data.items);
  });

export const createTransactionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(CreateTransactionsInputSchema)
  .handler(async ({ data }) => {
    return await createTransactions(data);
  });

export const getTransactionByIdFn = createServerFn()
  .middleware([authMiddleware])
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await getTransactionById(data);
  });

export const updateTransactionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(
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
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await deleteTransaction(data);
  });
