import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { TransactionCategory } from "@/generated/prisma/enums";

import {
  rejectUnlessE2E,
  resetFinancePreferences,
  resetTestData,
  seedTestData,
  seedTrendsTestData,
} from "@/app/e2e/e2e.service.server";
import { setCategoryTrendsVisibleCategories } from "@/app/finance/preferences/preferences.service.server";

const SeedSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset") }),
  z.object({
    action: z.literal("seed"),
    scenario: z.enum(["below-pace", "no-history", "on-pace", "over-income"]).optional(),
  }),
  z.object({ action: z.literal("seed-trends") }),
  z.object({ action: z.literal("reset-preferences") }),
  z.object({ action: z.literal("set-category-trends"), categories: z.array(z.string()) }),
]);

/** Same operations as the `/e2e` page buttons, without loading the page. */
export const Route = createFileRoute("/api/e2e/seed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rejection = await rejectUnlessE2E();
        if (rejection) {
          return rejection;
        }
        const parsed = SeedSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
        }
        const input = parsed.data;
        if (input.action === "reset") {
          await resetTestData();
        } else if (input.action === "seed") {
          await seedTestData(input.scenario);
        } else if (input.action === "seed-trends") {
          await seedTrendsTestData();
        } else if (input.action === "reset-preferences") {
          await resetFinancePreferences();
        } else {
          await setCategoryTrendsVisibleCategories(input.categories as Array<TransactionCategory>);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
