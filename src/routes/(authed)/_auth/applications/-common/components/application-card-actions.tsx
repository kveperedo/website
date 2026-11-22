"use client";

import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

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
            <ApplicationCardMenu
                applicationId={application.id}
                link={application.link}
                status={application.status}
                onStatusChange={onStatusChange}
            />
        </div>
    );
};
