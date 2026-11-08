import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { LinkButton } from "@/components/ui/button";
import { formatLocal } from "@/lib/date-only";

import { ApplicationCardMenu } from "./application-card-menu";

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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted) {
      rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlighted]);

  const hasNotes = Boolean(application.notes?.trim());

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

      <div className="absolute -top-1 right-1.5 flex items-center gap-0.5">
        <LinkButton
          href={application.link}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="icon-sm"
          aria-label={`Open ${application.position} at ${application.company} in a new tab`}
        >
          <ExternalLinkIcon className="size-3.5" />
        </LinkButton>
        <ApplicationCardMenu
          applicationId={application.id}
          status={application.status}
          onStatusChange={onStatusChange}
        />
      </div>

      {hasNotes && (
        <div className="mx-2 mt-3 border-l-2 border-border/60 bg-muted/10 px-3 py-1.5 text-xs leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
          {application.notes}
        </div>
      )}
    </div>
  );
};
