import { z } from "zod";

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

const ScheduledFormEndTypeSchema = z.discriminatedUnion("endType", [
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
