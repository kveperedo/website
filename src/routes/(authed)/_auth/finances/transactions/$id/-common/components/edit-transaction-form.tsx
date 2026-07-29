import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import type { TransactionCategory } from "@/generated/zod/schemas/enums/TransactionCategory.schema";

import { Card } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { TransactionInputSchema } from "@/generated/zod/schemas/variants/input/Transaction.input";
import {
  AmountField,
  CategoryField,
  DateField,
  DescriptionField,
  TypeField,
} from "@/routes/(authed)/_auth/finances/-common/components/transaction-fields";

import { Route } from "../..";
import { CreateScheduleCard } from "./create-schedule-card";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { ScheduledTransactionCard } from "./scheduled-transaction-card";

export const FORM_ID = "edit-transaction-form";

const editFormSchema = TransactionInputSchema.extend({ transactedAt: z.iso.datetime() });

export type EditFormData = z.infer<typeof editFormSchema>;

type EditTransactionFormProps = {
  onSubmit: (data: EditFormData) => Promise<void>;
};

function EditTransactionForm({ onSubmit }: EditTransactionFormProps) {
  const { transaction } = Route.useLoaderData();

  const {
    control,
    formState: { isDirty },
    handleSubmit,
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      description: transaction.description,
      amount: transaction.amount,
      transactedAt: transaction.transactedAt.toISOString(),
      type: transaction.type,
      category: (transaction.category ?? null) as TransactionCategory | null,
    },
  });

  const watchTransactedAt = useWatch({ control, name: "transactedAt" });
  const watchType = useWatch({ control, name: "type" });

  const handleSave = async (updatedTransaction: EditFormData) => {
    try {
      await onSubmit(updatedTransaction);
      reset(updatedTransaction);
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
        <Card className="flex flex-col gap-5 p-5">
          <FieldGroup>
            <DescriptionField control={control} name="description" />
            <AmountField control={control} name="amount" />
            <DateField control={control} name="transactedAt" />
          </FieldGroup>

          <TypeField control={control} name="type" />

          {watchType === "expense" && <CategoryField control={control} name="category" />}
        </Card>
        <div className="flex flex-col gap-4 sm:shrink-0 sm:basis-xs">
          {transaction.template ? (
            <ScheduledTransactionCard />
          ) : (
            <CreateScheduleCard transactedAt={new Date(watchTransactedAt)} isDisabled={isDirty} />
          )}
          <DeleteTransactionButton />
        </div>
      </div>
    </form>
  );
}

export { EditTransactionForm };
