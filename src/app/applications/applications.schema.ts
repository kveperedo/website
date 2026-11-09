import { z } from "zod";

import { ApplicationStatusSchema } from "@/generated/zod/schemas/enums/ApplicationStatus.schema";

export const MAX_APPLICATION_LINK_LENGTH = 2_048;
export const MAX_APPLICATION_NOTES_LENGTH = 5_000;

export const ApplicationFieldsSchema = z
  .object({
    position: z
      .string()
      .trim()
      .min(1, "Enter a position.")
      .max(255, "Position must be 255 characters or fewer."),
    company: z
      .string()
      .trim()
      .min(1, "Enter a company.")
      .max(255, "Company must be 255 characters or fewer."),
    link: z
      .url({ protocol: /^https?$/, error: "Enter a valid http or https link." })
      .max(MAX_APPLICATION_LINK_LENGTH, "Link must be 2,048 characters or fewer."),
    status: ApplicationStatusSchema,
    appliedAt: z.iso.date({ error: "Choose a valid applied date." }).nullable(),
    notes: z
      .string()
      .trim()
      .max(MAX_APPLICATION_NOTES_LENGTH, "Notes must be 5,000 characters or fewer.")
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "saved" && data.appliedAt !== null) {
      ctx.addIssue({
        code: "custom",
        message: "Saved applications cannot have an applied date",
        path: ["appliedAt"],
      });
    }

    if (data.status !== "saved" && data.appliedAt === null) {
      ctx.addIssue({
        code: "custom",
        message: "An applied date is required once an application is submitted",
        path: ["appliedAt"],
      });
    }
  });

export type ApplicationFields = z.infer<typeof ApplicationFieldsSchema>;

export const CreateApplicationInputSchema = ApplicationFieldsSchema;

export type CreateApplicationInput = z.infer<typeof CreateApplicationInputSchema>;

export const UpdateApplicationInputSchema = z.object({
  id: z.uuid(),
  data: ApplicationFieldsSchema,
});

export type UpdateApplicationInput = z.infer<typeof UpdateApplicationInputSchema>;

export const UpdateApplicationStatusInputSchema = z.object({
  id: z.uuid(),
  status: ApplicationStatusSchema,
});

export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusInputSchema>;
