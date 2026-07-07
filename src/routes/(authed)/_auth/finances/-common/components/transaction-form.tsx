"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { z } from "zod";

import type { TransactionItemAIType } from "@/schema/transaction";

import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  TransactionInputSchema,
  type TransactionInputType,
} from "@/generated/zod/schemas/variants/input/Transaction.input";

import {
  AmountField,
  CategoryField,
  DateField,
  DescriptionField,
  TypeField,
} from "./transaction-fields";

const transactionFormSchema = z.object({
  transactions: z.array(TransactionInputSchema.extend({ transactedAt: z.iso.datetime() })),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

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

function TransactionCard({
  control,
  index,
  totalCount,
}: {
  control: Control<TransactionFormData>;
  index: number;
  totalCount: number;
}) {
  const type = useWatch({
    control,
    name: `transactions.${index}.type`,
  });

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

      {type === "expense" && (
        <CategoryField control={control} name={`transactions.${index}.category`} />
      )}
    </Card>
  );
}

type TransactionFormProps = {
  initialTransactions?: Array<TransactionItemAIType>;
  onSave: (transactions: Array<TransactionInputType>) => void;
  mode: "idle" | "saving";
};

function TransactionForm({ initialTransactions, onSave, mode }: TransactionFormProps) {
  const now = new Date().toISOString();

  const { control, handleSubmit } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactions:
        initialTransactions?.map((t) => ({
          description: t.description,
          amount: t.amount,
          transactedAt: t.transactedAt ? enrichDate(t.transactedAt) : now,
          type: t.type,
          category: t.category ?? null,
        })) ?? [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "transactions",
  });

  const onSubmit = (data: TransactionFormData) => {
    onSave(
      data.transactions.map((t) => ({
        ...t,
        category: t.type === "income" ? null : t.category,
        transactedAt: new Date(t.transactedAt),
      })),
    );
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
            totalCount={fields.length}
          />
        ))}
      </div>

      <div className="flex shrink-0 gap-3">
        <BackButton to="/finances" />
        <Button className="flex-1 sm:flex-none" type="submit" disabled={mode === "saving"}>
          {mode === "saving" && <Spinner data-icon="inline-start" />}
          Save Transaction
        </Button>
      </div>
    </form>
  );
}

export { TransactionForm };
