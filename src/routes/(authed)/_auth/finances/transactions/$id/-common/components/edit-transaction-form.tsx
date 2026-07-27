import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, type LinkProps } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import type { TransactionCategory } from "@/generated/zod/schemas/enums/TransactionCategory.schema";

import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { TransactionInputSchema } from "@/generated/zod/schemas/variants/input/Transaction.input";
import {
  AmountField,
  CategoryField,
  DateField,
  DescriptionField,
  TypeField,
} from "@/routes/(authed)/_auth/finances/-common/components/transaction-fields";
import { updateTransactionFn } from "@/utils/transactions.function";

import { Route } from "../..";
import { CreateScheduleCard } from "./create-schedule-card";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { ScheduledTransactionCard } from "./scheduled-transaction-card";

const editFormSchema = TransactionInputSchema.extend({ transactedAt: z.iso.datetime() });

type EditFormData = z.infer<typeof editFormSchema>;

type EditTransactionFormProps = {
  backTo?: LinkProps["to"];
  backSearch?: LinkProps["search"];
};

function EditTransactionForm({ backTo, backSearch }: EditTransactionFormProps) {
  const router = useRouter();
  const { transaction } = Route.useLoaderData();
  const [isSaving, setIsSaving] = useState(false);
  const updateTransaction = useServerFn(updateTransactionFn);

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
    setIsSaving(true);
    try {
      await updateTransaction({
        data: {
          id: transaction.id,
          data: {
            ...updatedTransaction,
            category: updatedTransaction.type === "income" ? null : updatedTransaction.category,
            transactedAt: new Date(updatedTransaction.transactedAt),
          },
        },
      });
      await router.invalidate();
      reset(updatedTransaction);
    } catch {
      // TODO: Add snackbar for error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      className="flex h-full w-full flex-col gap-6 self-stretch"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <Card className="flex flex-col gap-5 p-5">
          <FieldGroup>
            <DescriptionField control={control} name="description" />
            <AmountField control={control} name="amount" />
            <DateField control={control} name="transactedAt" />
          </FieldGroup>

          <TypeField control={control} name="type" />

          {watchType === "expense" && <CategoryField control={control} name="category" />}
        </Card>
        {transaction.template ? (
          <ScheduledTransactionCard />
        ) : (
          <CreateScheduleCard transactedAt={new Date(watchTransactedAt)} isDisabled={isDirty} />
        )}
      </div>

      <div className="flex shrink-0 gap-3">
        <BackButton to={backTo} search={backSearch} />
        <Button className="flex-1 sm:flex-none" type="submit" isDisabled={isSaving}>
          {isSaving && <Spinner data-icon="inline-start" />}
          Save Changes
        </Button>

        <DeleteTransactionButton />
      </div>
    </form>
  );
}

export { EditTransactionForm };
