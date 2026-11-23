"use client";

import type { ReactNode } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import {
    ScheduledFormEditSchema,
    type ScheduledFormEditData,
} from "@/app/finance/scheduled/scheduled.schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import {
    DayOfMonthField,
    EndDateField,
    EndTypeField,
    MaxOccurrencesField,
    StartDateField,
} from "@/routes/(authed)/_auth/finances/-common/components/schedule-transaction-fields";
import {
    AmountField,
    CategoryField,
    DescriptionField,
    TypeField,
} from "@/routes/(authed)/_auth/finances/-common/components/transaction-fields";

export const FORM_ID = "scheduled-transaction-form";

type ScheduledTransactionFormProps = {
    defaultValues: ScheduledFormEditData;
    onSubmit: (data: ScheduledFormEditData) => Promise<void>;
    isDisabled?: boolean;
    headerAction?: ReactNode;
    actions?: ReactNode;
};

export function ScheduledTransactionForm({
    defaultValues,
    onSubmit,
    isDisabled,
    headerAction,
    actions,
}: ScheduledTransactionFormProps) {
    const { control, handleSubmit, reset } = useForm<ScheduledFormEditData>({
        resolver: zodResolver(ScheduledFormEditSchema),
        defaultValues,
    });

    const watchType = useWatch({ control, name: "type" });
    const watchEndType = useWatch({ control, name: "endType" });

    const handleSave = async (data: ScheduledFormEditData) => {
        try {
            await onSubmit(data);
            reset(data);
        } catch {
            // Keep dirty values for retry
        }
    };

    return (
        <form
            id={FORM_ID}
            onSubmit={handleSubmit(handleSave)}
            className="flex w-full min-w-0 flex-1 flex-col"
        >
            <Card variant="flat" className="flex min-w-0 flex-1 flex-col lg:border-0">
                <CardHeader variant="flat" className="justify-between gap-2">
                    <CardTitle variant="flat">Schedule details</CardTitle>
                    {headerAction}
                </CardHeader>
                <CardContent className="p-3">
                    <FieldGroup className="gap-4">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="min-w-0 sm:flex-[6]">
                                <DescriptionField
                                    control={control}
                                    name="description"
                                    isDisabled={isDisabled}
                                />
                            </div>
                            <div className="min-w-0 sm:flex-[4]">
                                <AmountField
                                    control={control}
                                    name="amount"
                                    isDisabled={isDisabled}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="min-w-0 sm:flex-[5]">
                                <TypeField control={control} name="type" isDisabled={isDisabled} />
                            </div>
                            {watchType === "expense" && (
                                <div className="min-w-0 sm:flex-[5]">
                                    <CategoryField
                                        control={control}
                                        name="category"
                                        isDisabled={isDisabled}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="border-t border-subtle pt-4">
                            <FieldGroup className="gap-4">
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="min-w-0 sm:flex-[5]">
                                        <StartDateField
                                            control={control}
                                            name="startDate"
                                            isDisabled={isDisabled}
                                        />
                                    </div>
                                    <div className="min-w-0 sm:flex-[5]">
                                        <DayOfMonthField
                                            control={control}
                                            name="dayOfMonth"
                                            isDisabled={isDisabled}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="min-w-0 sm:flex-[5]">
                                        <EndTypeField
                                            control={control}
                                            name="endType"
                                            isDisabled={isDisabled}
                                        />
                                    </div>
                                    {(watchEndType === "date" || watchEndType === "count") && (
                                        <div className="min-w-0 sm:flex-[5]">
                                            {watchEndType === "date" ? (
                                                <EndDateField
                                                    control={control}
                                                    name="endDate"
                                                    isDisabled={isDisabled}
                                                />
                                            ) : (
                                                <MaxOccurrencesField
                                                    control={control}
                                                    name="maxOccurrences"
                                                    isDisabled={isDisabled}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </FieldGroup>
                        </div>
                    </FieldGroup>
                </CardContent>
                {actions && <CardFooter className="justify-end gap-2 p-3">{actions}</CardFooter>}
            </Card>
        </form>
    );
}
