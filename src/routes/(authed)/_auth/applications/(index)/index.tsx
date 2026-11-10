import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { startTransition, useEffect, useOptimistic, useState } from "react";
import { z } from "zod";

import type { ApplicationStatus } from "@/generated/prisma/enums";

import {
  changeApplicationStatusFn,
  getApplicationsFn,
} from "@/app/applications/applications.functions";
import { AppContainer } from "@/components/app-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dateOnlyToDatabaseDate, todayDateOnly } from "@/lib/date-only";

import { ActiveView } from "../-common/components/active-view";
import { ApplicationsHeader } from "../-common/components/applications-header";
import { ClosedView } from "../-common/components/closed-view";
import {
  CreateApplicationDialog,
  CreateApplicationPanel,
} from "../-common/components/create-application";

const searchSchema = z.object({
  view: z.enum(["active", "closed"]).optional(),
});

export const Route = createFileRoute("/(authed)/_auth/applications/(index)/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Applications | Kevin Von Erich Peredo" }] }),
  loader: async () => {
    const applications = await getApplicationsFn();

    return { applications };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { applications } = Route.useLoaderData();
  const { view } = Route.useSearch();
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

  const current: "active" | "closed" = view === "closed" ? "closed" : "active";

  return (
    <AppContainer
      classNames={{
        root: "flex flex-col lg:h-dvh lg:overflow-hidden",
        main: "min-h-0 flex-1",
      }}
      header={
        <ApplicationsHeader current={current}>
          <CreateApplicationDialog />
        </ApplicationsHeader>
      }
    >
      <div className="container mx-auto flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-0">
        <h1 className="sr-only">{current === "closed" ? "Closed applications" : "Applications"}</h1>
        <Tabs
          selectedKey={current}
          onSelectionChange={(key) => {
            if (key === "closed") {
              router.navigate({ to: "/applications", search: { view: "closed" } });
            } else if (key === "active") {
              router.navigate({ to: "/applications" });
            }
          }}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <TabsList
            variant="line"
            aria-label="Applications views"
            className="w-full justify-start gap-6 border-b border-border/60"
          >
            <TabsTrigger
              id="active"
              className="flex-none px-1 font-heading text-sm after:bg-primary"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              id="closed"
              className="flex-none px-1 font-heading text-sm after:bg-primary"
            >
              Closed
            </TabsTrigger>
          </TabsList>
          <TabsContent id="active" className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
            <div className="flex min-h-0 flex-1 flex-col">
              <ActiveView
                applications={optimisticApplications}
                highlightedId={highlightedId}
                onStatusChange={handleStatusChange}
              />
            </div>
            <CreateApplicationPanel />
          </TabsContent>
          <TabsContent id="closed" className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
            <div className="flex min-h-0 flex-1 flex-col">
              <ClosedView
                applications={optimisticApplications}
                highlightedId={highlightedId}
                onStatusChange={handleStatusChange}
              />
            </div>
            <CreateApplicationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppContainer>
  );
}
