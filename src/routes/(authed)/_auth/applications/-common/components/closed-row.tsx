"use client";

import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { formatLocal } from "@/lib/date-only";
import { cn } from "@/lib/utils";

import { APPLICATION_STATUS_DOT_STYLES } from "../constants";
import { ApplicationCardActions } from "./application-card-actions";
import { ApplicationNotes } from "./application-notes";
import { useHighlightedScroll } from "./use-highlighted-scroll";

type ClosedRowProps = {
  application: Pick<
    JobApplication,
    "id" | "position" | "company" | "link" | "status" | "appliedAt" | "updatedAt" | "notes"
  >;
  highlighted: boolean;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

export const ClosedRow = ({ application, highlighted, onStatusChange }: ClosedRowProps) => {
  const rootRef = useHighlightedScroll(highlighted);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="flex min-w-0 items-center gap-2 pr-16 font-heading text-sm font-medium text-foreground">
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              APPLICATION_STATUS_DOT_STYLES[application.status],
            )}
          />
          <span className="max-w-[60%] truncate">{application.company}</span>
          <span className="min-w-0 flex-1 truncate text-xs font-normal text-muted-foreground">
            {application.position}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {application.appliedAt && (
            <span className="font-mono text-xxs text-muted-foreground">
              Applied {formatLocal(application.appliedAt, "MM/dd/yyyy")}
            </span>
          )}
          <span className="font-mono text-xxs text-muted-foreground">
            Closed {formatLocal(application.updatedAt, "MM/dd/yyyy")}
          </span>
        </div>
      </div>

      <ApplicationCardActions application={application} onStatusChange={onStatusChange} />

      <ApplicationNotes notes={application.notes} />
    </div>
  );
};
