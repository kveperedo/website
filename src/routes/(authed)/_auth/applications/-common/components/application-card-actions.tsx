"use client";

import { ExternalLinkIcon } from "lucide-react";

import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { LinkButton } from "@/components/ui/button";

import { ApplicationCardMenu } from "./application-card-menu";

type ApplicationCardActionsProps = {
  application: Pick<JobApplication, "id" | "position" | "company" | "link" | "status">;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

export const ApplicationCardActions = ({
  application,
  onStatusChange,
}: ApplicationCardActionsProps) => {
  return (
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
  );
};
