import type { JobApplication } from "@/generated/prisma/client";

type SearchableApplication = Pick<JobApplication, "company" | "position" | "notes">;

export const matchesApplicationQuery = (
    application: SearchableApplication,
    normalizedQuery: string,
): boolean =>
    application.company.toLowerCase().includes(normalizedQuery) ||
    application.position.toLowerCase().includes(normalizedQuery) ||
    (application.notes ?? "").toLowerCase().includes(normalizedQuery);
