import { useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
    DayOfMonthField,
    EndDateField,
    EndTypeField,
    MaxOccurrencesField,
} from "@/routes/(authed)/_auth/finances/-common/components/schedule-transaction-fields";
import {
    AmountField,
    CategoryField,
    DateField,
    DescriptionField,
    TypeField,
} from "@/routes/(authed)/_auth/finances/-common/components/transaction-fields";

import type { TransactionFormData } from "../../../../-common/transaction-form-schema";

type TransactionEditorProps = {
    index: number;
};

export const TransactionEditor = ({ index }: TransactionEditorProps) => {
    const { control, getValues, setValue } = useFormContext<TransactionFormData>();
    const watchType = useWatch({ control, name: `transactions.${index}.type` });
    const watchEndType = useWatch({
        control,
        name: `transactions.${index}.schedule.endType`,
    });
    const hasInitializedSchedule = useRef(false);

    return (
        <FieldGroup className="gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="min-w-0 sm:flex-[6]">
                    <DescriptionField
                        control={control}
                        name={`transactions.${index}.description`}
                    />
                </div>
                <div className="min-w-0 sm:flex-[4]">
                    <AmountField control={control} name={`transactions.${index}.amount`} />
                </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="min-w-0 sm:flex-[5]">
                    <DateField control={control} name={`transactions.${index}.transactedAt`} />
                </div>
                <div className="min-w-0 sm:flex-[5]">
                    <TypeField control={control} name={`transactions.${index}.type`} />
                </div>
            </div>
            {watchType === "expense" && (
                <CategoryField control={control} name={`transactions.${index}.category`} />
            )}
            <Controller
                control={control}
                name={`transactions.${index}.scheduleEnabled`}
                render={({ field }) => {
                    const setScheduleEnabled = (isSelected: boolean) => {
                        if (isSelected && !hasInitializedSchedule.current) {
                            const transactedAt = getValues(`transactions.${index}.transactedAt`);
                            setValue(
                                `transactions.${index}.schedule`,
                                {
                                    dayOfMonth: new Date(transactedAt).getDate(),
                                    endType: "none",
                                },
                                { shouldDirty: true },
                            );
                            hasInitializedSchedule.current = true;
                        }

                        field.onChange(isSelected);
                    };

                    return (
                        <>
                            <Field orientation="horizontal">
                                <Checkbox
                                    id={`transactions-${index}-schedule`}
                                    isSelected={field.value}
                                    onChange={setScheduleEnabled}
                                />
                                <FieldLabel htmlFor={`transactions-${index}-schedule`}>
                                    Schedule transaction
                                </FieldLabel>
                            </Field>

                            {field.value && (
                                <FieldGroup className="flex flex-col gap-4 border-t border-border pt-4">
                                    <DayOfMonthField
                                        control={control}
                                        name={`transactions.${index}.schedule.dayOfMonth`}
                                    />
                                    <EndTypeField
                                        control={control}
                                        name={`transactions.${index}.schedule.endType`}
                                    />
                                    {watchEndType === "date" && (
                                        <EndDateField
                                            control={control}
                                            name={`transactions.${index}.schedule.endDate`}
                                        />
                                    )}
                                    {watchEndType === "count" && (
                                        <MaxOccurrencesField
                                            control={control}
                                            name={`transactions.${index}.schedule.maxOccurrences`}
                                        />
                                    )}
                                </FieldGroup>
                            )}
                        </>
                    );
                }}
            />
        </FieldGroup>
    );
};
