"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { Card } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import {
  AmountField,
  CategoryField,
  DescriptionField,
  TypeField,
} from "@/routes/(authed)/_auth/finances/-common/components/transaction-fields";
import {
  DayOfMonthField,
  EndDateField,
  EndTypeField,
  MaxOccurrencesField,
} from "@/routes/(authed)/_auth/finances/transactions/-common/components/schedule-transaction-fields";
import {
  ScheduledFormEditSchema,
  type ScheduledFormEditData,
} from "@/schema/scheduled-transaction";

import { Route } from "../..";
import { DeleteTemplateButton } from "./delete-template-button";
import { TemplateSummaryCard } from "./template-summary-card";

export const FORM_ID = "edit-scheduled-form";

type EditScheduledFormProps = {
  onSubmit: (data: ScheduledFormEditData) => Promise<void>;
};

function EditScheduledForm({ onSubmit }: EditScheduledFormProps) {
  const { template } = Route.useLoaderData();

  const { control, handleSubmit, reset } = useForm<ScheduledFormEditData>({
    resolver: zodResolver(ScheduledFormEditSchema),
    defaultValues: {
      description: template.description,
      amount: template.amount,
      type: template.type,
      category: (template.category ?? null) as TransactionCategory | null,
      dayOfMonth: template.dayOfMonth,
      endType: template.endDate ? "date" : template.maxOccurrences ? "count" : "none",
      endDate: template.endDate ?? undefined,
      maxOccurrences: template.maxOccurrences ?? undefined,
      isActive: template.isActive,
    },
  });

  const watchType = useWatch({ control, name: "type" });
  const watchEndType = useWatch({ control, name: "endType" });

  const handleSave = async (data: ScheduledFormEditData) => {
    try {
      await onSubmit(data);
      reset(data);
    } catch {
      // Keep the dirty values available so the user can retry the save.
    }
  };

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(handleSave)}
      className="flex h-full w-full flex-col gap-6 self-stretch"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto sm:flex-row sm:items-start">
        <Card className="flex flex-1 flex-col gap-5 p-5">
          <FieldGroup>
            <DescriptionField control={control} name="description" />
            <AmountField control={control} name="amount" />
          </FieldGroup>

          <TypeField control={control} name="type" />

          {watchType === "expense" && <CategoryField control={control} name="category" />}

          <FieldGroup className="border-t border-border pt-5">
            <DayOfMonthField control={control} name="dayOfMonth" />
            <EndTypeField control={control} name="endType" />
            {watchEndType === "date" && <EndDateField control={control} name="endDate" />}
            {watchEndType === "count" && (
              <MaxOccurrencesField control={control} name="maxOccurrences" />
            )}
          </FieldGroup>
        </Card>
        <div className="flex flex-col gap-4 sm:shrink-0 sm:basis-xs">
          <TemplateSummaryCard />
          <DeleteTemplateButton />
        </div>
      </div>
    </form>
  );
}

export { EditScheduledForm };
