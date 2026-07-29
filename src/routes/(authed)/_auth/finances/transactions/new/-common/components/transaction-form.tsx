"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";

import type { ScheduledTransactionInput } from "@/schema/scheduled-transaction";
import type { TransactionItemAIType } from "@/schema/transaction";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { type TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import {
  AmountField,
  CategoryField,
  DateField,
  DescriptionField,
  TypeField,
} from "@/routes/(authed)/_auth/finances/-common/components/transaction-fields";

import {
  DayOfMonthField,
  EndDateField,
  EndTypeField,
  MaxOccurrencesField,
} from "../../../-common/components/schedule-transaction-fields";
import {
  transactionFormSchema,
  type TransactionFormData,
} from "../../../../-common/transaction-form-schema";

export type NewTransactionInput = Omit<TransactionInputType, "template"> & {
  schedule?: ScheduledTransactionInput;
};

const enrichDate = (dateStr: string) => {
  const now = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(
    y,
    m - 1,
    d,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  ).toISOString();
};

const TransactionCard = ({
  control,
  getValues,
  index,
  setValue,
  totalCount,
}: {
  control: Control<TransactionFormData>;
  getValues: UseFormGetValues<TransactionFormData>;
  index: number;
  setValue: UseFormSetValue<TransactionFormData>;
  totalCount: number;
}) => {
  const watchType = useWatch({ control, name: `transactions.${index}.type` });
  const watchEndType = useWatch({
    control,
    name: `transactions.${index}.schedule.endType`,
  });
  const hasInitializedSchedule = useRef(false);

  return (
    <Card className="flex flex-col gap-5 p-5">
      {totalCount > 1 && (
        <p className="text-xs text-muted-foreground">
          transaction {index + 1} of {totalCount}
        </p>
      )}

      <FieldGroup>
        <DescriptionField control={control} name={`transactions.${index}.description`} />
        <AmountField control={control} name={`transactions.${index}.amount`} />
        <DateField control={control} name={`transactions.${index}.transactedAt`} />
      </FieldGroup>

      <TypeField control={control} name={`transactions.${index}.type`} />

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
                <FieldGroup className="flex flex-col gap-4 border-t border-border pt-5">
                  <DayOfMonthField
                    control={control}
                    name={`transactions.${index}.schedule.dayOfMonth`}
                  />
                  <EndTypeField control={control} name={`transactions.${index}.schedule.endType`} />
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
    </Card>
  );
};

export const FORM_ID = "new-transaction-form";

type TransactionFormProps = {
  transactions?: Array<TransactionItemAIType>;
  onSubmit: (data: TransactionFormData) => void;
};

function TransactionForm({ transactions, onSubmit }: TransactionFormProps) {
  const now = new Date().toISOString();

  const { control, getValues, handleSubmit, setValue } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactions:
        transactions?.map((t) => ({
          description: t.description,
          amount: t.amount,
          transactedAt: t.transactedAt ? enrichDate(t.transactedAt) : now,
          type: t.type,
          category: t.category ?? null,
          scheduleEnabled: false,
        })) ?? [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "transactions",
  });

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className="flex h-full w-full flex-col gap-6 self-stretch"
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-6 overflow-y-auto sm:grid-cols-2">
        {fields.map((field, index) => (
          <TransactionCard
            key={field.id}
            index={index}
            control={control}
            getValues={getValues}
            setValue={setValue}
            totalCount={fields.length}
          />
        ))}
      </div>
    </form>
  );
}

export { TransactionForm };
