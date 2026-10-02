import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { rejectUnlessE2E, resetTestData, seedTestData, seedTrendsTestData } from "@/app/e2e/server";

const SeedSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset") }),
  z.object({
    action: z.literal("seed"),
    scenario: z.enum(["below-pace", "no-history", "on-pace", "over-income"]).optional(),
  }),
  z.object({ action: z.literal("seed-trends") }),
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
        } else {
          await seedTrendsTestData();
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
