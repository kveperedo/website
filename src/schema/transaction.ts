import { z } from "zod";

import { TransactionCategorySchema } from "@/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "@/generated/zod/schemas/enums/TransactionType.schema";
import { TransactionInputSchema } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { ScheduledTransactionInputSchema } from "./scheduled-transaction";

export const MAX_TRANSACTION_AMOUNT = 10_000_000;
export const MAX_DESCRIPTION_LENGTH = 280;

export const ParsedTransactionSchema = z.object({
  description: TransactionInputSchema.shape.description.trim().min(1).max(MAX_DESCRIPTION_LENGTH),
  /** Null when the entry carried no recognisable amount; the review form asks for one. */
  amount: TransactionInputSchema.shape.amount.positive().max(MAX_TRANSACTION_AMOUNT).nullable(),
  type: TransactionTypeSchema,
  category: TransactionCategorySchema.nullable(),
  transactedAt: z.iso.date(),
});

export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;

export const CreateTransactionsInputSchema = z.array(
  TransactionInputSchema.omit({
    template: true,
    templateId: true,
  })
    .extend({
      schedule: ScheduledTransactionInputSchema.optional(),
    })
    .superRefine((transaction, ctx) => {
      if (
        transaction.schedule?.endDate &&
        transaction.schedule.endDate < transaction.transactedAt.toISOString().slice(0, 10)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date cannot be before the transaction date",
          path: ["schedule", "endDate"],
        });
      }
    }),
);
