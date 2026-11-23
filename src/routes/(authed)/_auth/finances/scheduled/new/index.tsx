import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { ScheduledFormEditData } from "@/app/finance/scheduled/scheduled.schema";
import type { TransactionCategory } from "@/generated/prisma/enums";

import { createStandaloneScheduledTemplateFn } from "@/app/finance/scheduled/scheduled.functions";
import { AppHeader } from "@/components/app-header";
import { BreadcrumbItem, BreadcrumbPage, TanstackBreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { todayDateOnly } from "@/lib/date-only";

import {
    FORM_ID,
    ScheduledTransactionForm,
} from "../-common/components/scheduled-transaction-form";
import { FinanceContainer } from "../../-common/components/finance-container";

const DEFAULT_VALUES: ScheduledFormEditData = {
    description: "",
    amount: 0,
    type: "expense",
    category: null,
    startDate: todayDateOnly(),
    dayOfMonth: new Date().getDate(),
    endType: "none",
    status: "active",
};

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/new/")({
    head: () => ({
        meta: [{ title: "New Scheduled Transaction | Kevin Von Erich Peredo" }],
    }),
    component: RouteComponent,
});

function RouteComponent() {
    const router = useRouter();
    const createTemplate = useServerFn(createStandaloneScheduledTemplateFn);
    const [isSaving, setIsSaving] = useState(false);

    const handleBack = () => {
        router.navigate({ to: "/finances/scheduled" });
    };

    const handleSubmit = async (data: ScheduledFormEditData) => {
        setIsSaving(true);
        try {
            await createTemplate({
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
                    maxOccurrences: data.endType === "count" ? (data.maxOccurrences ?? null) : null,
                    status: data.status,
                },
            });
            await router.invalidate({ sync: true });
            router.navigate({ to: "/finances/scheduled" });
        } finally {
            setIsSaving(false);
        }
    };

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
                        <BreadcrumbPage>New Schedule</BreadcrumbPage>
                    </BreadcrumbItem>
                </AppHeader>
            }
        >
            <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-y-auto p-4 sm:px-0">
                <h1 className="sr-only">New scheduled transaction</h1>
                <div className="m-auto w-full">
                    <Card
                        variant="flat"
                        className="flex w-full flex-col border-0 bg-transparent lg:border lg:bg-border"
                    >
                        <ScheduledTransactionForm
                            defaultValues={DEFAULT_VALUES}
                            onSubmit={handleSubmit}
                            actions={
                                <>
                                    <Button
                                        variant="secondary"
                                        className="flex-1 sm:flex-none"
                                        onPress={handleBack}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 sm:flex-none"
                                        type="submit"
                                        form={FORM_ID}
                                        isDisabled={isSaving}
                                    >
                                        {isSaving && <Spinner data-icon="inline-start" />}
                                        Create Schedule
                                    </Button>
                                </>
                            }
                        />
                    </Card>
                </div>
            </div>
        </FinanceContainer.Root>
    );
}
