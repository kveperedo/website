import { z } from "zod";

import { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

export const monthQuerySchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  q: z.string().optional(),
  type: z.enum(TransactionType).optional(),
  categories: z.array(z.enum(TransactionCategory)).optional(),
});
