"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import {
  APPLICATION_STATUS_DOT_STYLES,
  APPLICATION_STATUS_LABELS,
  CLOSED_APPLICATION_STATUSES,
  type ClosedFilter,
} from "../constants";

type ClosedTabsProps = {
  filter: ClosedFilter;
  onFilterChange: (filter: ClosedFilter) => void;
};

export const ClosedTabs = ({ filter, onFilterChange }: ClosedTabsProps) => {
  return (
    <ToggleGroup
      selectionMode="single"
      selectedKeys={[filter]}
      onSelectionChange={(keys) => {
        const next = ([...keys][0] as ClosedFilter | undefined) ?? "all";
        onFilterChange(next);
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="Filter closed applications by status"
      className="flex-wrap"
    >
      <ToggleGroupItem
        id="all"
        className="data-selected:bg-secondary data-selected:text-foreground"
      >
        All
      </ToggleGroupItem>
      {CLOSED_APPLICATION_STATUSES.map((status) => (
        <ToggleGroupItem
          key={status}
          id={status}
          className="data-selected:bg-secondary data-selected:text-foreground"
        >
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", APPLICATION_STATUS_DOT_STYLES[status])}
          />
          {APPLICATION_STATUS_LABELS[status]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
