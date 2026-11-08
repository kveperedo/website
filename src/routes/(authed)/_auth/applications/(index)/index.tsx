import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { startTransition, useEffect, useOptimistic, useState } from "react";

import type { ApplicationStatus } from "@/generated/prisma/enums";

import {
  changeApplicationStatusFn,
  getApplicationsFn,
} from "@/app/applications/applications.functions";
import { AppContainer } from "@/components/app-container";
import { BackButton } from "@/components/back-button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { dateOnlyToDatabaseDate, todayDateOnly } from "@/lib/date-only";

import { ApplicationBoardColumn } from "../-common/components/application-board-column";
import {
  CreateApplicationDialog,
  CreateApplicationPanel,
} from "../-common/components/create-application";
import { ACTIVE_APPLICATION_STATUSES } from "../-common/constants";

export const Route = createFileRoute("/(authed)/_auth/applications/(index)/")({
  head: () => ({ meta: [{ title: "Applications | Kevin Von Erich Peredo" }] }),
  loader: async () => {
    const applications = await getApplicationsFn();

    return { applications };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { applications } = Route.useLoaderData();
  const router = useRouter();
  const changeStatus = useServerFn(changeApplicationStatusFn);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [optimisticApplications, addOptimisticStatus] = useOptimistic(
    applications,
    (current, update: { id: string; status: ApplicationStatus }) =>
      current.map((application) => {
        if (application.id !== update.id) {
          return application;
        }

        if (update.status === "saved") {
          return {
            ...application,
            status: update.status,
            appliedAt: null,
            updatedAt: new Date(),
          };
        }

        return {
          ...application,
          status: update.status,
          appliedAt: application.appliedAt ?? dateOnlyToDatabaseDate(todayDateOnly()),
          updatedAt: new Date(),
        };
      }),
  );

  useEffect(() => {
    if (!highlightedId) {
      return;
    }

    const timeout = setTimeout(() => {
      setHighlightedId(null);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [highlightedId]);

  const handleStatusChange = (id: string, next: ApplicationStatus) => {
    setHighlightedId(id);

    startTransition(async () => {
      addOptimisticStatus({ id, status: next });

      try {
        await changeStatus({ data: { id, status: next } });
        await router.invalidate({ sync: true });
      } catch {
        // The optimistic update is discarded when the transition settles.
      }
    });
  };

  const activeApplications = optimisticApplications.filter((application) =>
    ACTIVE_APPLICATION_STATUSES.includes(application.status),
  );

  const activeGroups = ACTIVE_APPLICATION_STATUSES.map((status) => {
    const applications = activeApplications
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

    return { status, applications };
  });

  return (
    <AppContainer
      classNames={{
        root: "flex flex-col lg:h-dvh lg:overflow-hidden",
        main: "min-h-0 flex-1",
      }}
      header={
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton to="/" variant="icon" />
            <h1 className="font-heading text-lg font-medium text-foreground">Applications</h1>
          </div>
          <CreateApplicationDialog />
        </div>
      }
    >
      <div className="container mx-auto flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-0">
        <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
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
                        : "Applications in Offer, Rejected, or Withdrawn are hidden from the board."}
                    </EmptyDescription>
                  </EmptyHeader>
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
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>

          <CreateApplicationPanel />
        </div>
      </div>
    </AppContainer>
  );
}
