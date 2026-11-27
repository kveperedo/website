import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { ScheduledFormEditData } from "@/app/finance/scheduled/scheduled.schema";
import type { TransactionCategory } from "@/generated/prisma/enums";

import {
    getScheduledTransactionTemplateByIdFn,
    updateScheduledTransactionTemplateFn,
} from "@/app/finance/scheduled/scheduled.functions";
import { AppHeader } from "@/components/app-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BreadcrumbItem, BreadcrumbPage, TanstackBreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import {
    FORM_ID,
    ScheduledTransactionForm,
} from "../-common/components/scheduled-transaction-form";
import { FinanceContainer } from "../../-common/components/finance-container";
import { ArchiveTemplateButton } from "./-common/components/archive-template-button";
import { TemplateSummaryCard } from "./-common/components/template-summary-card";

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/$id/")({
    loader: async ({ params }) => {
        const template = await getScheduledTransactionTemplateByIdFn({ data: params.id });
        return { template };
    },
    head: ({ loaderData }) => {
        const { template } = loaderData!;
        return {
            meta: [
                {
                    title: `Edit ${template.description} | Kevin Von Erich Peredo`,
                },
            ],
        };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const router = useRouter();
    const { template } = Route.useLoaderData();
    const updateTemplate = useServerFn(updateScheduledTransactionTemplateFn);
    const [isSaving, setIsSaving] = useState(false);
    const isArchived = template.status === "archived";

    const handleBack = () => {
        void router.navigate({ to: "/finances/scheduled" });
    };

    const handleSubmit = async (data: ScheduledFormEditData) => {
        if (isArchived) {
            return;
        }
        setIsSaving(true);
        try {
            await updateTemplate({
                data: {
                    id: template.id,
                    data: {
                        description: data.description,
                        amount: data.amount,
                        type: data.type,
                        category: (data.type === "income"
                            ? null
                            : data.category) as TransactionCategory | null,
                        startDate: data.startDate,
                        dayOfMonth: data.dayOfMonth,
                        endDate: data.endType === "date" ? (data.endDate ?? null) : null,
                        maxOccurrences:
                            data.endType === "count" ? (data.maxOccurrences ?? null) : null,
                        status: data.status,
                    },
                },
            });
            await router.invalidate();
        } finally {
            setIsSaving(false);
        }
    };

    const getEndType = (): ScheduledFormEditData["endType"] => {
        if (template.endDate) {
            return "date";
        }
        if (template.maxOccurrences) {
            return "count";
        }
        return "none";
    };
    const endType = getEndType();

    const buildDefaultValues = (): ScheduledFormEditData => {
        const base = {
            description: template.description,
            amount: template.amount,
            type: template.type,
            category: (template.category ?? null) as TransactionCategory | null,
            startDate: template.startDate,
            dayOfMonth: template.dayOfMonth,
            // Archived templates cannot be edited; form is disabled so status value is irrelevant.
            // Provide a placeholder that satisfies EditableStatusSchema.
            status: (isArchived ? "active" : template.status) as ScheduledFormEditData["status"],
        };
        if (endType === "date") {
            return { ...base, endType, endDate: template.endDate as string };
        }
        if (endType === "count") {
            return { ...base, endType, maxOccurrences: template.maxOccurrences as number };
        }
        return { ...base, endType };
    };
    const defaultValues = buildDefaultValues();

    return (
        <FinanceContainer.Root
            classNames={{
                root: "flex flex-col lg:h-dvh lg:overflow-hidden",
                main: "min-h-0 flex-1",
            }}
            header={
                <AppHeader>
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/">Home</TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/finances">Finances</TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/finances/scheduled">
                            Scheduled
                        </TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Edit Schedule</BreadcrumbPage>
                    </BreadcrumbItem>
                </AppHeader>
            }
        >
            <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-y-auto p-4 sm:px-0">
                <h1 className="sr-only">Edit schedule</h1>
                <div className="m-auto flex w-full flex-col gap-4">
                    {isArchived && (
                        <Alert className="shrink-0">
                            <AlertTitle>Archived</AlertTitle>
                            <AlertDescription>
                                This schedule is archived and cannot be edited.
                            </AlertDescription>
                        </Alert>
                    )}
                    <Card
                        variant="flat"
                        className="flex w-full flex-col gap-4 border-0 bg-transparent lg:flex-row lg:gap-px lg:border lg:bg-border"
                    >
                        <ScheduledTransactionForm
                            defaultValues={defaultValues}
                            onSubmit={handleSubmit}
                            isDisabled={isArchived}
                            headerAction={isArchived ? undefined : <ArchiveTemplateButton />}
                            actions={
                                <>
                                    <Button
                                        variant="secondary"
                                        className="flex-1 sm:flex-none"
                                        onPress={handleBack}
                                    >
                                        Cancel
                                    </Button>
                                    {!isArchived && (
                                        <Button
                                            className="flex-1 sm:flex-none"
                                            type="submit"
                                            form={FORM_ID}
                                            isDisabled={isSaving}
                                        >
                                            {isSaving && <Spinner data-icon="inline-start" />}
                                            Save Changes
                                        </Button>
                                    )}
                                </>
                            }
                        />
                        <div className="lg:w-xs lg:shrink-0">
                            <TemplateSummaryCard />
                        </div>
                    </Card>
                </div>
            </div>
        </FinanceContainer.Root>
    );
}
