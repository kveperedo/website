"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
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

import type { ScheduledTransactionInput } from "@/app/finance/scheduled/scheduled.schema";
import type { ParsedTransaction } from "@/app/finance/transactions/transactions.schema";

import { dateOnlyToDatabaseDate, todayDateOnly } from "@/app/finance/shared/local-date";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { type TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
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

import {
  transactionFormSchema,
  type TransactionFormData,
} from "../../../../-common/transaction-form-schema";

export type NewTransactionInput = Omit<TransactionInputType, "template"> & {
  schedule?: ScheduledTransactionInput;
};

const enrichDate = (dateStr: string) => {
  return dateOnlyToDatabaseDate(dateStr).toISOString();
};

type TransactionFormEntry = TransactionFormData["transactions"][number];

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

const TransactionCard = ({
  control,
  getValues,
  index,
  onRemove,
  setValue,
  totalCount,
}: {
  control: Control<TransactionFormData>;
  getValues: UseFormGetValues<TransactionFormData>;
  index: number;
  onRemove: () => void;
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Transaction {index + 1} of {totalCount}
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          aria-label={`Delete transaction ${index + 1}`}
          onPress={onRemove}
        >
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      </div>

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
  transactions?: Array<ParsedTransaction>;
  onSubmit: (data: TransactionFormData) => void;
  onCountChange: (count: number) => void;
};

function TransactionForm({ transactions, onSubmit, onCountChange }: TransactionFormProps) {
  const { control, getValues, handleSubmit, setValue } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactions: (transactions ?? []).map(toFormEntry),
    },
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "transactions",
  });

  const handleAdd = () => {
    onCountChange(fields.length + 1);
    append(createBlankTransaction(), { shouldFocus: true });
  };

  const handleRemove = (index: number) => {
    onCountChange(fields.length - 1);
    remove(index);
  };

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className="flex h-full w-full flex-col gap-6 self-stretch"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {fields.length === 0 ? (
          <Card className="flex flex-1 items-center py-6">
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
          <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
            {fields.map((field, index) => (
              <TransactionCard
                key={field.id}
                index={index}
                control={control}
                getValues={getValues}
                onRemove={() => handleRemove(index)}
                setValue={setValue}
                totalCount={fields.length}
              />
            ))}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full shrink-0 sm:w-auto sm:self-start"
        onPress={handleAdd}
      >
        <PlusIcon data-icon="inline-start" />
        Add transaction
      </Button>
    </form>
  );
}

export { TransactionForm };
