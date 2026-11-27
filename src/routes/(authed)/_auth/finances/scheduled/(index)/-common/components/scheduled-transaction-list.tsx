import { useRouter } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { GridList } from "@/components/ui/grid-list";

import { Route } from "../..";
import { ScheduledTemplateListItem } from "../../../-common/components/scheduled-template-list-item";
import { ScheduledTemplateActions } from "./scheduled-template-actions";

type ScheduledTransactionListProps = {
    view: "active" | "archived";
    isLoading: string | null;
    isArchiving: string | null;
    onToggle: (id: string) => void;
    onArchive: (id: string) => void;
};

export const ScheduledTransactionList = ({
    view,
    isLoading,
    isArchiving,
    onToggle,
    onArchive,
}: ScheduledTransactionListProps) => {
    const { templates, archivedTemplates } = Route.useLoaderData();
    const router = useRouter();
    const isArchivedView = view === "archived";
    const items = isArchivedView ? archivedTemplates : templates;
    const label = isArchivedView ? "Archived scheduled transactions" : "Scheduled transactions";

    const handleRowAction = (id: string) => {
        router.navigate({
            to: "/finances/scheduled/$id",
            params: { id },
        });
    };

    return (
        <Card variant="flat" className="flex min-h-0 min-w-0 flex-1 flex-col border-0 py-0">
            <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
                {items.length === 0 ? (
                    <div className="py-8">
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>
                                    {isArchivedView
                                        ? "No archived schedules."
                                        : "No scheduled transactions."}
                                </EmptyTitle>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <GridList
                        items={items}
                        aria-label={label}
                        className="w-full gap-0 divide-y divide-subtle"
                    >
                        {(template) => (
                            <ScheduledTemplateListItem
                                template={template}
                                onAction={handleRowAction}
                                actions={
                                    !isArchivedView && (
                                        <ScheduledTemplateActions
                                            id={template.id}
                                            status={template.status}
                                            isLoading={isLoading === template.id}
                                            isArchiving={isArchiving === template.id}
                                            onToggle={onToggle}
                                            onArchive={onArchive}
                                        />
                                    )
                                }
                            />
                        )}
                    </GridList>
                )}
            </CardContent>
        </Card>
    );
};
