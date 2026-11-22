import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

import type { ScheduledTransactionInput } from "@/app/finance/scheduled/scheduled.schema";
import type { ParsedTransaction } from "@/app/finance/transactions/transactions.schema";
import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { dateOnlyToDatabaseDate, todayDateOnly } from "@/lib/date-only";
import { cn } from "@/lib/utils";

import {
    transactionFormSchema,
    type TransactionFormData,
} from "../../../../-common/transaction-form-schema";
import { TransactionEditor } from "./transaction-editor";
import { TransactionOverview } from "./transaction-overview";

export const FORM_ID = "new-transaction-form";

export type NewTransactionInput = Omit<TransactionInputType, "template"> & {
    schedule?: ScheduledTransactionInput;
};

type TransactionFormEntry = TransactionFormData["transactions"][number];

const enrichDate = (dateStr: string) => dateOnlyToDatabaseDate(dateStr).toISOString();

const toFormEntry = (transaction: ParsedTransaction): TransactionFormEntry => ({
    description: transaction.description,
    // Zero renders the field empty; the form schema requires a positive amount so the
    // user cannot save the blank value.
    amount: transaction.amount ?? 0,
    transactedAt: enrichDate(transaction.transactedAt),
    type: transaction.type,
    category: transaction.category ?? null,
    scheduleEnabled: false,
});

const createBlankTransaction = (): TransactionFormEntry =>
    toFormEntry({
        description: "",
        amount: null,
        transactedAt: todayDateOnly(),
        type: "expense",
        category: null,
    });

type TransactionFormProps = {
    transactions?: Array<ParsedTransaction>;
    onSubmit: (data: TransactionFormData) => void;
    onCountChange: (count: number) => void;
    actions?: ReactNode;
};

function TransactionForm({ transactions, onSubmit, onCountChange, actions }: TransactionFormProps) {
    const methods = useForm<TransactionFormData>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            transactions: (transactions ?? []).map(toFormEntry),
        },
    });
    const { control, handleSubmit } = methods;

    const { append, fields, remove } = useFieldArray({
        control,
        name: "transactions",
    });
    const [activeIndex, setActiveIndex] = useState(0);

    const handleAdd = () => {
        onCountChange(fields.length + 1);
        append(createBlankTransaction(), { shouldFocus: true });
        setActiveIndex(fields.length);
    };

    const handleRemove = (index: number) => {
        onCountChange(fields.length - 1);
        remove(index);
        setActiveIndex((current) => {
            const remaining = fields.length - 1;
            if (remaining === 0) {
                return 0;
            }
            if (index < current) {
                return current - 1;
            }
            return Math.min(current, remaining - 1);
        });
    };

    const setActiveTransaction = (index: number) =>
        setActiveIndex(Math.max(0, Math.min(index, fields.length - 1)));

    return (
        <FormProvider {...methods}>
            <form
                id={FORM_ID}
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-col gap-4"
            >
                <Card
                    variant="flat"
                    className="flex flex-col border-0 bg-transparent py-0 lg:border lg:bg-border"
                >
                    {fields.length === 0 ? (
                        <Card variant="flat" className="flex flex-1 items-center p-6 lg:border-0">
                            <Empty>
                                <EmptyHeader>
                                    <EmptyTitle>No transactions left.</EmptyTitle>
                                    <EmptyDescription>
                                        Add a transaction below to continue, or cancel to go back.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        </Card>
                    ) : (
                        <div className="flex flex-col lg:flex-row lg:gap-px">
                            <Card
                                variant="flat"
                                className="flex min-w-0 flex-1 flex-col gap-0 py-0 lg:border-0"
                            >
                                <CardHeader variant="flat" className="justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <div className="flex shrink-0 items-center gap-0.5">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label="Previous transaction"
                                                isDisabled={activeIndex === 0}
                                                onPress={() =>
                                                    setActiveTransaction(activeIndex - 1)
                                                }
                                            >
                                                <ChevronLeftIcon />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label="Next transaction"
                                                isDisabled={activeIndex === fields.length - 1}
                                                onPress={() =>
                                                    setActiveTransaction(activeIndex + 1)
                                                }
                                            >
                                                <ChevronRightIcon />
                                            </Button>
                                        </div>
                                        <CardTitle variant="flat" className="shrink-0">
                                            Transaction {activeIndex + 1} of {fields.length}
                                        </CardTitle>
                                    </div>
                                    <div className="flex shrink-0 items-center">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            aria-label={`Delete transaction ${activeIndex + 1}`}
                                            onPress={() => handleRemove(activeIndex)}
                                        >
                                            <Trash2Icon data-icon="inline-start" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="border-t border-subtle p-3">
                                    <TransactionEditor index={activeIndex} />
                                </CardContent>
                            </Card>
                            <TransactionOverview
                                fields={fields}
                                activeIndex={activeIndex}
                                onSelect={setActiveTransaction}
                                onAdd={handleAdd}
                            />
                        </div>
                    )}
                    <CardFooter className="justify-end gap-2 border-t border-subtle bg-card p-3">
                        {actions}
                    </CardFooter>
                </Card>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full sm:w-auto sm:self-start",
                        fields.length > 0 && "lg:hidden",
                    )}
                    onPress={handleAdd}
                >
                    <PlusIcon data-icon="inline-start" />
                    Add transaction
                </Button>
            </form>
        </FormProvider>
    );
}

export { TransactionForm };
