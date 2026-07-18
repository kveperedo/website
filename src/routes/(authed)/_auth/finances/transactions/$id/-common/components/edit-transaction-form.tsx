"use client";

import type { LinkProps } from "@tanstack/react-router";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Control } from "react-hook-form";
import { z } from "zod";

import type { TransactionInputType } from "@/generated/zod/schemas";
import type { TransactionCategory } from "@/generated/zod/schemas/enums/TransactionCategory.schema";

import { BackButton } from "@/components/back-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const editFormSchema = z.object({
  transactions: z.array(TransactionInputSchema.extend({ transactedAt: z.iso.datetime() })),
});

type EditFormData = z.infer<typeof editFormSchema>;

type EditTransactionFormProps = {
  transaction: {
    id: string;
    description: string;
    amount: number;
    type: "expense" | "income";
    category: string | null;
    transactedAt: Date;
  };
  onSave: (data: TransactionInputType) => Promise<void>;
  onDelete: () => Promise<void>;
  mode: "idle" | "saving" | "deleting";
  backTo?: LinkProps["to"];
  backSearch?: LinkProps["search"];
};

function EditContent({ control }: { control: Control<EditFormData> }) {
  const type = useWatch({
    control,
    name: "transactions.0.type",
  });

  return (
    <Card className="flex flex-col gap-5 p-5">
      <FieldGroup>
        <DescriptionField control={control} name="transactions.0.description" />
        <AmountField control={control} name="transactions.0.amount" />
        <DateField control={control} name="transactions.0.transactedAt" />
      </FieldGroup>

      <TypeField control={control} name="transactions.0.type" />

      {type === "expense" && <CategoryField control={control} name="transactions.0.category" />}
    </Card>
  );
}

function EditTransactionForm({
  transaction,
  onSave,
  onDelete,
  mode,
  backTo,
  backSearch,
}: EditTransactionFormProps) {
  const { control, handleSubmit } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      transactions: [
        {
          description: transaction.description,
          amount: transaction.amount,
          transactedAt: transaction.transactedAt.toISOString(),
          type: transaction.type,
          category: (transaction.category ?? null) as TransactionCategory | null,
        },
      ],
    },
  });

  const onSubmit = (data: EditFormData) => {
    const item = data.transactions[0];
    onSave({
      ...item,
      category: item.type === "income" ? null : item.category,
      transactedAt: new Date(item.transactedAt),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex h-full w-full flex-col gap-6 self-stretch"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <EditContent control={control} />
      </div>

      <div className="flex shrink-0 gap-3">
        <BackButton to={backTo} search={backSearch} />
        <Button className="flex-1 sm:flex-none" type="submit" isDisabled={mode === "saving"}>
          {mode === "saving" && <Spinner data-icon="inline-start" />}
          Save Changes
        </Button>

        <AlertDialogTrigger>
          <Button variant="destructive">Delete Transaction</Button>
          <AlertDialog>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this transaction.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                isDisabled={mode === "deleting"}
                onPress={onDelete}
              >
                {mode === "deleting" && <Spinner data-icon="inline-start" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialog>
        </AlertDialogTrigger>
      </div>
    </form>
  );
}

export { EditTransactionForm };
