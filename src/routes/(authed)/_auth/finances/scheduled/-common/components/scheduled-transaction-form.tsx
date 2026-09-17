"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Card } from "@/components/ui/card";
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
import {
  ScheduledFormEditSchema,
  type ScheduledFormEditData,
} from "@/schema/scheduled-transaction";

export const FORM_ID = "scheduled-transaction-form";

type ScheduledTransactionFormProps = {
  defaultValues: ScheduledFormEditData;
  onSubmit: (data: ScheduledFormEditData) => Promise<void>;
  isDisabled?: boolean;
};

export function ScheduledTransactionForm({
  defaultValues,
  onSubmit,
  isDisabled,
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
      className="flex h-full w-full flex-col gap-6 self-stretch"
    >
      <Card className="flex flex-1 flex-col gap-5 p-5">
        <FieldGroup>
          <DescriptionField control={control} name="description" isDisabled={isDisabled} />
          <AmountField control={control} name="amount" isDisabled={isDisabled} />
        </FieldGroup>

        <TypeField control={control} name="type" isDisabled={isDisabled} />

        {watchType === "expense" && (
          <CategoryField control={control} name="category" isDisabled={isDisabled} />
        )}

        <FieldGroup className="border-t border-border pt-5">
          <StartDateField control={control} name="startDate" isDisabled={isDisabled} />
          <DayOfMonthField control={control} name="dayOfMonth" isDisabled={isDisabled} />
          <EndTypeField control={control} name="endType" isDisabled={isDisabled} />
          {watchEndType === "date" && (
            <EndDateField control={control} name="endDate" isDisabled={isDisabled} />
          )}
          {watchEndType === "count" && (
            <MaxOccurrencesField control={control} name="maxOccurrences" isDisabled={isDisabled} />
          )}
        </FieldGroup>
      </Card>
    </form>
  );
}
