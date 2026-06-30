import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authMiddleware } from "./auth.middleware";
import {
  createTransaction,
  createTransactions,
  getTransactions,
  parseTransactions,
  parsedTransactionSchema,
} from "./transactions.server";

export const getTransactionsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return await getTransactions();
  });

export const parseTransactionWithAIFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.string().max(1000, "Input too long — max 1000 characters"))
  .handler(async ({ data: text }) => {
    return await parseTransactions(text);
  });

export const createTransactionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(parsedTransactionSchema)
  .handler(async ({ data }) => {
    return await createTransaction(data);
  });

export const createTransactionsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.array(parsedTransactionSchema))
  .handler(async ({ data }) => {
    return await createTransactions(data);
  });
