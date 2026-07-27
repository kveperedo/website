"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
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

import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { type TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";
import {
  AmountField,
  CategoryField,
  DateField,
  DescriptionField,
  TypeField,
} from "@/routes/(authed)/_auth/finances/-common/components/transaction-fields";
import { createTransactionsFn } from "@/utils/transactions.function";

import { Route } from "../..";
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

type TransactionFormProps = {
  initialTransactions?: Array<TransactionItemAIType>;
};

function TransactionForm({ initialTransactions }: TransactionFormProps) {
  const now = new Date().toISOString();
  const router = useRouter();
  const { returnTo } = Route.useSearch();

  const [isSaving, setIsSaving] = useState(false);
  const createTransactions = useServerFn(createTransactionsFn);

  const { control, getValues, handleSubmit, setValue } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactions:
        initialTransactions?.map((t) => ({
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

  const onSubmit = async (data: TransactionFormData) => {
    if (data.transactions.length === 0) {
      return;
    }

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
              endDate: schedule.endType === "date" ? (schedule.endDate ?? null) : null,
              maxOccurrences:
                schedule.endType === "count" ? (schedule.maxOccurrences ?? null) : null,
            };
          }

          return transactionInput;
        }),
      });
      router.navigate({ to: returnTo ?? "/finances" });
    } catch {
      // TODO: Add snackbar for error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex h-full w-full flex-col gap-6 self-stretch"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
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

      <div className="flex shrink-0 gap-3">
        <BackButton />
        <Button className="flex-1 sm:flex-none" type="submit" isDisabled={isSaving}>
          {isSaving && <Spinner data-icon="inline-start" />}
          Save Transaction
        </Button>
      </div>
    </form>
  );
}

export { TransactionForm };
