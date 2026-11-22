import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

import type { FileRouteTypes } from "@/routeTree.gen";

import { createTransactionsFn } from "@/app/finance/transactions/transactions.functions";
import { ParsedTransactionSchema } from "@/app/finance/transactions/transactions.schema";
import { AppHeader } from "@/components/app-header";
import { BreadcrumbItem, BreadcrumbPage, TanstackBreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import type { TransactionFormData } from "../../-common/transaction-form-schema";

import { FinanceContainer } from "../../-common/components/finance-container";
import {
    FORM_ID,
    TransactionForm,
    type NewTransactionInput,
} from "./-common/components/transaction-form";

type AppRoutePath = FileRouteTypes["to"];

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
    { title: "Finances | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(authed)/_auth/finances/transactions/new/")({
    head: () => ({ meta: META }),
    validateSearch: z.object({
        transactions: z.array(ParsedTransactionSchema).default([]),
        returnTo: z.string().optional() as z.ZodType<AppRoutePath | undefined>,
    }),
    component: RouteComponent,
});

function RouteComponent() {
    const router = useRouter();
    const { transactions, returnTo } = Route.useSearch();
    const createTransactions = useServerFn(createTransactionsFn);
    const [isSaving, setIsSaving] = useState(false);
    const [transactionCount, setTransactionCount] = useState(transactions.length);

    const handleSubmit = async (data: TransactionFormData) => {
        setIsSaving(true);
        try {
            await createTransactions({
                data: data.transactions.map((transaction) => {
                    const transactionInput: NewTransactionInput = {
                        description: transaction.description,
                        amount: transaction.amount,
                        type: transaction.type,
                        category: transaction.type === "income" ? null : transaction.category,
                        transactedAt: new Date(transaction.transactedAt),
                    };

                    if (transaction.scheduleEnabled) {
                        const { schedule } = transaction;

                        transactionInput.schedule = {
                            dayOfMonth: schedule.dayOfMonth!,
                            endDate:
                                schedule.endType === "date" ? (schedule.endDate ?? null) : null,
                            maxOccurrences:
                                schedule.endType === "count"
                                    ? (schedule.maxOccurrences ?? null)
                                    : null,
                        };
                    }

                    return transactionInput;
                }),
            });
            await router.invalidate({ sync: true });
            router.navigate({ to: returnTo ?? "/finances" });
        } catch {
            // TODO: Add snackbar for error
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        router.navigate({ to: returnTo ?? "/finances" });
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
                        <BreadcrumbPage>New Transaction</BreadcrumbPage>
                    </BreadcrumbItem>
                </AppHeader>
            }
        >
            <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 p-4 sm:px-0">
                <h1 className="sr-only">New Transaction</h1>
                <TransactionForm
                    transactions={transactions}
                    onSubmit={handleSubmit}
                    onCountChange={setTransactionCount}
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
                                isDisabled={isSaving || transactionCount === 0}
                            >
                                {isSaving && <Spinner data-icon="inline-start" />}
                                Save {transactionCount > 1 ? "Transactions" : "Transaction"}
                            </Button>
                        </>
                    }
                />
            </div>
        </FinanceContainer.Root>
    );
}
