import type { ApplicationStatus } from "@/generated/prisma/enums";

export const APPLICATION_STATUS_ORDER: Array<ApplicationStatus> = [
  "saved",
  "applied",
  "offer",
  "rejected",
  "withdrawn",
];

export const ACTIVE_APPLICATION_STATUSES: Array<ApplicationStatus> = ["saved", "applied"];

export const OUTCOME_APPLICATION_STATUSES: Array<ApplicationStatus> = [
  "offer",
  "rejected",
  "withdrawn",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const APPLICATION_STATUS_DOT_STYLES: Record<ApplicationStatus, string> = {
  saved: "bg-muted-foreground",
  applied: "bg-sky-400",
  offer: "bg-emerald-400",
  rejected: "bg-rose-400",
  withdrawn: "bg-amber-400",
};

export const createStatusCounts = (): Record<ApplicationStatus, number> => {
  return Object.fromEntries(APPLICATION_STATUS_ORDER.map((status) => [status, 0])) as Record<
    ApplicationStatus,
    number
  >;
};
