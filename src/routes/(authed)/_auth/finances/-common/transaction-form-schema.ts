import { z } from "zod";

import { TransactionInputSchema } from "@/generated/zod/schemas/variants/input/Transaction.input";
import { ScheduledFormSchema } from "@/schema/scheduled-transaction";

export const scheduleFieldsSchema = z.object({
  dayOfMonth: z.number().optional(),
  endType: z.enum(["none", "date", "count"]).optional(),
  endDate: z.iso.date().optional(),
  maxOccurrences: z.number().optional(),
});

const ScheduleFormSchema = z.discriminatedUnion("scheduleEnabled", [
  z.object({ scheduleEnabled: z.literal(false) }),
  z.object({
    scheduleEnabled: z.literal(true),
    schedule: ScheduledFormSchema,
  }),
]);

export const transactionFormSchema = z
  .object({
    transactions: z.array(
      TransactionInputSchema.extend({
        transactedAt: z.iso.datetime(),
      }).and(ScheduleFormSchema),
    ),
  })
  .superRefine(({ transactions }, ctx) => {
    transactions.forEach((transaction, index) => {
      if (!transaction.scheduleEnabled) {
        return;
      }

      const { schedule } = transaction;

      if (schedule.endType === "date") {
        if (schedule.endDate < transaction.transactedAt.slice(0, 10)) {
          ctx.addIssue({
            code: "custom",
            message: "End date cannot be before the transaction date",
            path: ["transactions", index, "schedule", "endDate"],
          });
        }
      }
    });
  });

export type TransactionFormData = z.infer<typeof transactionFormSchema>;
