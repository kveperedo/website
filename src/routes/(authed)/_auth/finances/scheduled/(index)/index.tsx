import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import {
    archiveScheduledTransactionTemplateFn,
    getArchivedScheduledTransactionTemplatesFn,
    getScheduledTransactionTemplatesFn,
    toggleScheduledTransactionTemplateFn,
} from "@/app/finance/scheduled/scheduled.functions";
import { AppHeader } from "@/components/app-header";
import { BreadcrumbItem, BreadcrumbPage, TanstackBreadcrumbLink } from "@/components/ui/breadcrumb";
import { TanstackLinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FinanceContainer } from "../../-common/components/finance-container";
import { SummaryCard } from "../../-common/components/summary-card";
import { ScheduledTransactionList } from "./-common/components/scheduled-transaction-list";

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/(index)/")({
    validateSearch: z.object({
        view: z.enum(["active", "archived"]).optional(),
    }),
    loader: async () => {
        const [templates, archivedTemplates] = await Promise.all([
            getScheduledTransactionTemplatesFn(),
            getArchivedScheduledTransactionTemplatesFn(),
        ]);
        const activeTemplates = templates.filter((template) => template.status === "active");
        const { expenses, income } = activeTemplates.reduce(
            (acc, template) => {
                if (template.type === "expense") {
                    acc.expenses += template.amount;
                } else {
                    acc.income += template.amount;
                }
                return acc;
            },
            { expenses: 0, income: 0 },
        );
        return { templates, archivedTemplates, summary: { expenses, income } };
    },
    head: () => ({
        meta: [{ title: "Scheduled Transactions | Kevin Von Erich Peredo" }],
    }),
    component: RouteComponent,
});

function RouteComponent() {
    const { summary } = Route.useLoaderData();
    const { view } = Route.useSearch();
    const router = useRouter();
    const archiveScheduledTransactionTemplate = useServerFn(archiveScheduledTransactionTemplateFn);
    const toggleScheduledTransactionTemplate = useServerFn(toggleScheduledTransactionTemplateFn);

    const [isArchiving, setIsArchiving] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const current: "active" | "archived" = view === "archived" ? "archived" : "active";

    const handleToggleActive = async (id: string) => {
        setIsLoading(id);
        try {
            await toggleScheduledTransactionTemplate({ data: id });
            await router.invalidate();
        } finally {
            setIsLoading(null);
        }
    };

    const handleArchive = async (id: string) => {
        setIsArchiving(id);
        try {
            await archiveScheduledTransactionTemplate({ data: id });
            await router.invalidate();
        } finally {
            setIsArchiving(null);
        }
    };

    return (
        <FinanceContainer.Root
            classNames={{
                root: "flex flex-col lg:h-dvh lg:overflow-hidden",
                main: "min-h-0 flex-1",
            }}
            header={
                <AppHeader
                    trailingElement={
                        <TanstackLinkButton to="/finances/scheduled/new" size="sm" preload="intent">
                            <PlusIcon className="size-3.5" />
                            New schedule
                        </TanstackLinkButton>
                    }
                >
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/">Home</TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/finances">Finances</TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Scheduled</BreadcrumbPage>
                    </BreadcrumbItem>
                </AppHeader>
            }
            footer={<FinanceContainer.Footer />}
        >
            <div className="container mx-auto flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-0">
                <h1 className="sr-only">Scheduled transactions</h1>
                <Card
                    variant="flat"
                    className="flex min-h-0 flex-1 flex-col gap-px border bg-border"
                >
                    <Card variant="flat" className="flex shrink-0 flex-col gap-0 border-0 py-0">
                        <div className="p-3">
                            <Tabs
                                selectedKey={current}
                                onSelectionChange={(key) => {
                                    if (key === "archived") {
                                        void router.navigate({
                                            to: "/finances/scheduled",
                                            search: { view: "archived" },
                                        });
                                    } else {
                                        void router.navigate({ to: "/finances/scheduled" });
                                    }
                                }}
                                className="gap-0"
                            >
                                <TabsList
                                    variant="line"
                                    aria-label="Scheduled transaction views"
                                    className="flex-wrap"
                                >
                                    <TabsTrigger id="active">Active</TabsTrigger>
                                    <TabsTrigger id="archived">Archived</TabsTrigger>
                                </TabsList>
                                <TabsContent id="active" className="sr-only" />
                                <TabsContent id="archived" className="sr-only" />
                            </Tabs>
                        </div>
                    </Card>
                    <div className="flex min-h-0 flex-1 flex-col gap-px lg:contents">
                        <ScheduledTransactionList
                            view={current}
                            isLoading={isLoading}
                            isArchiving={isArchiving}
                            onToggle={handleToggleActive}
                            onArchive={handleArchive}
                        />
                        <SummaryCard
                            expenses={summary.expenses}
                            income={summary.income}
                            label="projected monthly"
                            testIdPrefix="scheduled-summary"
                            className="min-w-0 shrink-0 border-0"
                        />
                    </div>
                </Card>
            </div>
        </FinanceContainer.Root>
    );
}
