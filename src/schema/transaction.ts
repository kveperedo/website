import { z } from "zod";

import { TransactionCategorySchema } from "@/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "@/generated/zod/schemas/enums/TransactionType.schema";
import { TransactionInputSchema } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { ScheduledTransactionInputSchema } from "./scheduled-transaction";

export const TransactionItemAISchema = z.object({
  description: TransactionInputSchema.shape.description
    .min(1)
    .describe(
      "Clean, concise transaction description. Preserve the original text — do not paraphrase or reword. Only fix typos (and only if you're highly confident). Remove raw numbers (amount field captures them). Preserve merchant/vendor names when present.",
    ),
  amount: TransactionInputSchema.shape.amount
    .positive("Amount must be positive")
    .max(10_000_000)
    .describe("Transaction amount as a positive number."),
  type: TransactionTypeSchema.describe(
    "Whether this is an expense or income. Default to expense if unclear.",
  ),
  category: TransactionCategorySchema.nullable().describe(
    "Best matching category (ONLY for expenses — always null for income). Options: food_drinks (meals, coffee, snacks, delivery), groceries_household (supermarket, toiletries, cleaning), transportation (fuel, parking, rideshare, transit), bills_utilities (electricity, water, internet, phone, rent, subscriptions), health_wellness (medicine, doctor, gym, vitamins), hobbies_lifestyle (entertainment, shopping, personal care, travel, gifts), financial (transfers, bank fees, investments, loan payments). Use null for income transactions or when completely ambiguous (e.g. 'payment 500').",
  ),
  transactedAt: z.iso
    .date()
    .describe(
      'Transaction date in YYYY-MM-DD format. Use the user\'s local date from the parsing instructions if no date is mentioned. Resolve relative dates: "yesterday" → subtract 1 day, "last Monday" → most recent Monday. If a date applies to multiple transactions on different lines, use the date from that line. If no date on a line, inherit from the previous transaction.',
    ),
});

export type TransactionItemAIType = z.infer<typeof TransactionItemAISchema>;

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
