import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { createE2EFixture, deleteE2EFixtures, rejectUnlessE2E } from "@/app/e2e/server";
import {
  ScheduledTransactionStatus,
  TransactionCategory,
  TransactionType,
} from "@/generated/prisma/enums";

const CreateFixtureSchema = z
  .object({
    description: z.string().min(1),
    amount: z.number().positive(),
    type: z.enum(TransactionType).default("expense"),
    category: z.enum(TransactionCategory).nullable().default(null),
    schedule: z
      .object({
        dayOfMonth: z.number().int().min(1).max(31),
        maxOccurrences: z.number().int().positive().nullable().default(null),
        endDate: z.iso.date().nullable().default(null),
        status: z.enum(ScheduledTransactionStatus).default("active"),
      })
      .optional(),
    withTransaction: z.boolean().default(true),
  })
  .refine((input) => input.withTransaction || input.schedule !== undefined, {
    message: "withTransaction: false requires a schedule, or nothing would be created",
    path: ["withTransaction"],
  });

const DeleteFixturesSchema = z.object({
  descriptions: z.array(z.string().min(1)).min(1),
});

/** Lets Playwright set up and tear down rows directly instead of driving the UI. */
export const Route = createFileRoute("/api/e2e/fixtures")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rejection = await rejectUnlessE2E();
        if (rejection) {
          return rejection;
        }
        const parsed = CreateFixtureSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
        }
        return Response.json(await createE2EFixture(parsed.data));
      },
      DELETE: async ({ request }) => {
        const rejection = await rejectUnlessE2E();
        if (rejection) {
          return rejection;
        }
        const parsed = DeleteFixturesSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
        }
        await deleteE2EFixtures(parsed.data.descriptions);
        return new Response(null, { status: 204 });
      },
    },
  },
});
