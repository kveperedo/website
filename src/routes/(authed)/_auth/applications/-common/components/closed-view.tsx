"use client";

import { useState } from "react";

import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { GridList, GridListItem } from "@/components/ui/grid-list";
import { cn } from "@/lib/utils";

import { CLOSED_APPLICATION_STATUSES, type ClosedFilter, type ClosedSort } from "../constants";
import { ClosedRow } from "./closed-row";
import { ClosedTabs } from "./closed-tabs";
import { ClosedToolbar } from "./closed-toolbar";

type ClosedViewProps = {
  applications: Array<JobApplication>;
  highlightedId: string | null;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

export const ClosedView = ({ applications, highlightedId, onStatusChange }: ClosedViewProps) => {
  const [filter, setFilter] = useState<ClosedFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ClosedSort>("applied-date");

  const closedApplications = applications.filter((application) =>
    CLOSED_APPLICATION_STATUSES.includes(application.status),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;

  const filteredApplications = closedApplications
    .filter((application) => filter === "all" || application.status === filter)
    .filter((application) =>
      isFiltering
        ? application.company.toLowerCase().includes(normalizedQuery) ||
          application.position.toLowerCase().includes(normalizedQuery)
        : true,
    )
    .sort((first, second) => {
      if (sort === "company") {
        const companyDifference = first.company.localeCompare(second.company);

        if (companyDifference !== 0) {
          return companyDifference;
        }

        return first.position.localeCompare(second.position);
      }

      const appliedAtDifference =
        (second.appliedAt?.getTime() ?? 0) - (first.appliedAt?.getTime() ?? 0);

      if (appliedAtDifference !== 0) {
        return appliedAtDifference;
      }

      return second.updatedAt.getTime() - first.updatedAt.getTime();
    });

  const closedTotal = closedApplications.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ClosedTabs filter={filter} onFilterChange={setFilter} />
        <ClosedToolbar query={query} onQueryChange={setQuery} sort={sort} onSortChange={setSort} />
      </div>

      <Card className="flex flex-col gap-0 border-border/60 py-0 shadow-none lg:min-h-0 lg:flex-1">
        {filteredApplications.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            {closedTotal === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No closed applications yet</EmptyTitle>
                  <EmptyDescription>
                    Applications in Offer, Rejected, or Withdrawn will show up here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <p className="py-2 text-center text-xxs text-muted-foreground">
                {isFiltering ? "No matches" : "No closed applications"}
              </p>
            )}
          </div>
        ) : (
          <GridList
            items={filteredApplications}
            dependencies={[highlightedId]}
            aria-label="Closed applications"
            className="flex min-h-0 flex-col gap-0 divide-y divide-border/60 lg:flex-1 lg:overflow-y-auto"
          >
            {(application) => (
              <GridListItem
                id={application.id}
                data-application-id={application.id}
                data-status={application.status}
                textValue={`${application.company}, ${application.position}`}
                className={cn(
                  "relative px-3 py-3 transition-colors hover:bg-muted/20",
                  application.id === highlightedId && "bg-primary/10",
                )}
              >
                <ClosedRow
                  application={application}
                  highlighted={application.id === highlightedId}
                  onStatusChange={onStatusChange}
                />
              </GridListItem>
            )}
          </GridList>
        )}
      </Card>
    </div>
  );
};
