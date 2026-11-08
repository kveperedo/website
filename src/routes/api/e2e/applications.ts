import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { deleteE2EApplications, rejectUnlessE2E } from "@/app/e2e/e2e.service.server";

const DeleteApplicationsSchema = z.object({
  companies: z.array(z.string().min(1)).min(1),
});

/** Lets Playwright tear down job applications it created through the UI. */
export const Route = createFileRoute("/api/e2e/applications")({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        const rejection = await rejectUnlessE2E();
        if (rejection) {
          return rejection;
        }
        const parsed = DeleteApplicationsSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
        }
        await deleteE2EApplications(parsed.data.companies);
        return new Response(null, { status: 204 });
      },
    },
  },
});
