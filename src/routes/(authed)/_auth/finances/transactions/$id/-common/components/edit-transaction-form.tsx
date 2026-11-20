import type { ReactNode } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import type { TransactionCategory } from "@/generated/zod/schemas/enums/TransactionCategory.schema";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  actions?: ReactNode;
};

function EditTransactionForm({ onSubmit, actions }: EditTransactionFormProps) {
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
    <form id={FORM_ID} onSubmit={handleSubmit(handleSave)} className="flex w-full flex-col gap-4">
      <Card
        variant="flat"
        className="flex flex-col gap-4 border-0 bg-transparent lg:flex-row lg:gap-px lg:border lg:bg-border"
      >
        <Card variant="flat" className="flex min-w-0 flex-1 flex-col lg:border-0">
          <CardHeader variant="flat" className="justify-between gap-2">
            <CardTitle variant="flat">Transaction details</CardTitle>
            <DeleteTransactionButton />
          </CardHeader>
          <CardContent className="p-3">
            <FieldGroup className="gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="min-w-0 sm:flex-[6]">
                  <DescriptionField control={control} name="description" />
                </div>
                <div className="min-w-0 sm:flex-[4]">
                  <AmountField control={control} name="amount" />
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="min-w-0 sm:flex-[5]">
                  <DateField control={control} name="transactedAt" />
                </div>
                <div className="min-w-0 sm:flex-[5]">
                  <TypeField control={control} name="type" />
                </div>
              </div>
              {watchType === "expense" && <CategoryField control={control} name="category" />}
            </FieldGroup>
          </CardContent>
          {actions && <CardFooter className="justify-end gap-2 p-3">{actions}</CardFooter>}
        </Card>
        <div className="lg:w-xs lg:shrink-0">
          {transaction.template ? (
            <ScheduledTransactionCard />
          ) : (
            <CreateScheduleCard transactedAt={new Date(watchTransactedAt)} isDisabled={isDirty} />
          )}
        </div>
      </Card>
    </form>
  );
}

export { EditTransactionForm };
