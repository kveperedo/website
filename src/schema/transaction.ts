import { z } from "zod";

import { TransactionCategorySchema } from "#/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "#/generated/zod/schemas/enums/TransactionType.schema";
import { TransactionInputSchema } from "#/generated/zod/schemas/variants/input/Transaction.input";

const today = new Date().toISOString().split("T")[0];

export const TransactionItemAISchema = z.object({
  description: TransactionInputSchema.shape.description
    .min(1)
    .max(200)
    .describe(
      "Clean, concise transaction description. Remove raw numbers (amount field captures them). Keep natural but short. Preserve merchant/vendor names when present. Always start with a capital letter.",
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
      `Transaction date in YYYY-MM-DD format. Use today (${today}) if no date is mentioned. Resolve relative dates: "yesterday" → subtract 1 day, "last Monday" → most recent Monday. If a date applies to multiple transactions on different lines, use the date from that line. If no date on a line, inherit from the previous transaction.`,
    ),
});

export type TransactionItemAIType = z.infer<typeof TransactionItemAISchema>;
