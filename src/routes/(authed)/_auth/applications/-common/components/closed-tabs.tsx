"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <Tabs
            selectedKey={filter}
            onSelectionChange={(key) => onFilterChange((key as ClosedFilter | null) ?? "all")}
            className="gap-0"
        >
            <TabsList
                variant="line"
                aria-label="Filter closed applications by status"
                className="flex-wrap"
            >
                <TabsTrigger id="all">All</TabsTrigger>
                {CLOSED_APPLICATION_STATUSES.map((status) => (
                    <TabsTrigger key={status} id={status}>
                        <span
                            aria-hidden
                            className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                APPLICATION_STATUS_DOT_STYLES[status],
                            )}
                        />
                        {APPLICATION_STATUS_LABELS[status]}
                    </TabsTrigger>
                ))}
            </TabsList>
            <TabsContent id="all" className="sr-only" />
            {CLOSED_APPLICATION_STATUSES.map((status) => (
                <TabsContent key={status} id={status} className="sr-only" />
            ))}
        </Tabs>
    );
};
