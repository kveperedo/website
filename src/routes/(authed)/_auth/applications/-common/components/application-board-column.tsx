"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

import type { JobApplication } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { GridList, GridListItem } from "@/components/ui/grid-list";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

import { APPLICATION_STATUS_DOT_STYLES, APPLICATION_STATUS_LABELS } from "../constants";
import { ApplicationBoardCard } from "./application-board-card";

type ApplicationBoardColumnProps = {
  status: ApplicationStatus;
  applications: Array<JobApplication>;
  highlightedId: string | null;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

export const ApplicationBoardColumn = ({
  status,
  applications,
  highlightedId,
  onStatusChange,
}: ApplicationBoardColumnProps) => {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;

  const filteredApplications = isFiltering
    ? applications.filter(
        (application) =>
          application.company.toLowerCase().includes(normalizedQuery) ||
          application.position.toLowerCase().includes(normalizedQuery),
      )
    : applications;

  const label = APPLICATION_STATUS_LABELS[status];

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col",
        status === "saved" ? "lg:flex-[2]" : "lg:flex-[3]",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 pt-3 pb-3">
        <h2 className="flex shrink-0 items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", APPLICATION_STATUS_DOT_STYLES[status])}
          />
          {label}
        </h2>

        <InputGroup className="ml-auto h-7 w-40 shrink-0 border-border/60">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label={`Search ${label} applications`}
            className="h-7 text-xs"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onPress={() => setQuery("")}
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="py-2 text-center text-xxs text-muted-foreground">
            {isFiltering ? "No matches" : "No applications"}
          </p>
        </div>
      ) : (
        <GridList
          items={filteredApplications}
          dependencies={[highlightedId]}
          aria-label={`${label} applications`}
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
              <ApplicationBoardCard
                application={application}
                highlighted={application.id === highlightedId}
                onStatusChange={onStatusChange}
              />
            </GridListItem>
          )}
        </GridList>
      )}
    </section>
  );
};
