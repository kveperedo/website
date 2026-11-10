"use client";

import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { TanstackLinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

import { ACTIVE_APPLICATION_STATUSES } from "../constants";
import { ApplicationBoardColumn } from "./application-board-column";

type ActiveViewProps = {
  applications: Array<JobApplication>;
  highlightedId: string | null;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

export const ActiveView = ({ applications, highlightedId, onStatusChange }: ActiveViewProps) => {
  const activeApplications = applications.filter((application) =>
    ACTIVE_APPLICATION_STATUSES.includes(application.status),
  );

  const activeGroups = ACTIVE_APPLICATION_STATUSES.map((status) => {
    const statusApplications = activeApplications
      .filter((application) => application.status === status)
      .sort((first, second) => {
        if (status === "applied") {
          const appliedAtDifference =
            (second.appliedAt?.getTime() ?? 0) - (first.appliedAt?.getTime() ?? 0);

          if (appliedAtDifference !== 0) {
            return appliedAtDifference;
          }

          return second.updatedAt.getTime() - first.updatedAt.getTime();
        }

        return second.createdAt.getTime() - first.createdAt.getTime();
      });

    return { status, applications: statusApplications };
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {activeApplications.length === 0 ? (
        <Card className="flex flex-1 items-center justify-center p-8 shadow-none">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                {applications.length === 0 ? "No applications yet" : "No active applications"}
              </EmptyTitle>
              <EmptyDescription>
                {applications.length === 0
                  ? "Add your first job application to start tracking it."
                  : "Closed applications are hidden from the board."}
              </EmptyDescription>
            </EmptyHeader>
            {applications.length !== 0 && (
              <EmptyContent>
                <TanstackLinkButton
                  to="/applications"
                  search={{ view: "closed" }}
                  variant="outline"
                  size="sm"
                >
                  View closed applications
                </TanstackLinkButton>
              </EmptyContent>
            )}
          </Empty>
        </Card>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col gap-0 border-border/60 py-0 shadow-none">
          <div className="flex min-h-0 flex-1 flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
            {activeGroups.map((group) => (
              <ApplicationBoardColumn
                key={group.status}
                status={group.status}
                applications={group.applications}
                highlightedId={highlightedId}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
