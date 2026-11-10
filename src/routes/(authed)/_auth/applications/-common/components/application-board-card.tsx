import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { formatLocal } from "@/lib/date-only";

import { ApplicationCardActions } from "./application-card-actions";
import { ApplicationNotes } from "./application-notes";
import { useHighlightedScroll } from "./use-highlighted-scroll";

type ApplicationBoardCardProps = {
  application: Pick<
    JobApplication,
    "id" | "position" | "company" | "link" | "status" | "appliedAt" | "notes"
  >;
  highlighted: boolean;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

export const ApplicationBoardCard = ({
  application,
  highlighted,
  onStatusChange,
}: ApplicationBoardCardProps) => {
  const rootRef = useHighlightedScroll(highlighted);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex min-w-0 flex-col gap-1 pr-16">
        <h3 className="flex min-w-0 items-center gap-2 font-heading text-sm font-medium text-foreground">
          <span className="max-w-[60%] truncate">{application.company}</span>
          <span className="min-w-0 flex-1 truncate text-xs font-normal text-muted-foreground">
            {application.position}
          </span>
          {application.appliedAt && (
            <span className="shrink-0 pr-3 font-mono text-xxs font-normal text-muted-foreground">
              {formatLocal(application.appliedAt, "MM/dd/yyyy")}
            </span>
          )}
        </h3>
      </div>

      <ApplicationCardActions application={application} onStatusChange={onStatusChange} />

      <ApplicationNotes notes={application.notes} />
    </div>
  );
};
