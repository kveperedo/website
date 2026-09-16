import { z } from "zod";

import { TransactionCategorySchema } from "@/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "@/generated/zod/schemas/enums/TransactionType.schema";

export const ScheduledTransactionInputSchema = z.object({
  dayOfMonth: z.number().int().min(1).max(31),
  endDate: z.iso.date().nullable(),
  maxOccurrences: z.number().int().min(1).nullable(),
});

export type ScheduledTransactionInput = z.infer<typeof ScheduledTransactionInputSchema>;

export const CreateScheduledTransactionInputSchema = z.object({
  id: z.uuid(),
  schedule: ScheduledTransactionInputSchema,
});

export const UpdateScheduledTransactionInputSchema = z.object({
  id: z.uuid(),
  data: z.object({
    description: z.string().min(1).max(255),
    amount: z.number().positive(),
    type: TransactionTypeSchema,
    category: TransactionCategorySchema.nullable(),
    startDate: z.iso.date(),
    dayOfMonth: z.number().int().min(1).max(31),
    endDate: z.iso.date().nullable(),
    maxOccurrences: z.number().int().min(1).nullable(),
    isActive: z.boolean(),
  }),
});

export type UpdateScheduledTransactionInput = z.infer<typeof UpdateScheduledTransactionInputSchema>;

export const ScheduledFormEndTypeSchema = z.discriminatedUnion("endType", [
  z.object({
    endType: z.literal("none"),
  }),
  z.object({
    endType: z.literal("date"),
    endDate: z.iso.date(),
  }),
  z.object({
    endType: z.literal("count"),
    maxOccurrences: z.number().int().positive(),
  }),
]);

export const ScheduledFormSchema = z
  .object({ dayOfMonth: z.number().int().min(1).max(31) })
  .and(ScheduledFormEndTypeSchema);

export type ScheduledFormData = z.infer<typeof ScheduledFormSchema>;

export const ScheduledFormEditSchema = z
  .object({
    description: z.string().min(1).max(255),
    amount: z.number().positive(),
    type: TransactionTypeSchema,
    category: TransactionCategorySchema.nullable(),
    startDate: z.iso.date(),
    dayOfMonth: z.number().int().min(1).max(31),
    isActive: z.boolean(),
  })
  .and(ScheduledFormEndTypeSchema)
  .superRefine((data, ctx) => {
    if (data.endType === "date" && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be before start date",
        path: ["endDate"],
      });
    }
  });

export type ScheduledFormEditData = z.infer<typeof ScheduledFormEditSchema>;

export const CreateStandaloneScheduledTemplateInputSchema = z
  .object({
    description: z.string().min(1).max(255),
    amount: z.number().positive(),
    type: TransactionTypeSchema,
    category: TransactionCategorySchema.nullable(),
    startDate: z.iso.date(),
    dayOfMonth: z.number().int().min(1).max(31),
    endDate: z.iso.date().nullable(),
    maxOccurrences: z.number().int().min(1).nullable(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be before start date",
        path: ["endDate"],
      });
    }
  });

export type CreateStandaloneScheduledTemplateInput = z.infer<
  typeof CreateStandaloneScheduledTemplateInputSchema
>;
