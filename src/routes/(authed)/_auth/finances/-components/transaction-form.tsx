"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { z } from "zod";

import type { ParsedTransaction } from "#/utils/transactions.server";

import { TransactionCategorySchema } from "#/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "#/generated/zod/schemas/enums/TransactionType.schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup } from "@/components/ui/toggle-group";

import { CATEGORIES, CATEGORY_COLORS } from "../-constants";
import { CategoryToggleGroupItem } from "./category-toggle";

const transactionFormSchema = z.object({
  transactions: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      amount: z.number().positive("Amount must be positive"),
      date: z.iso.datetime(),
      type: TransactionTypeSchema,
      category: TransactionCategorySchema.nullable(),
    }),
  ),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

type TransactionFormProps = {
  initialTransactions?: Array<ParsedTransaction>;
  onSave: (transactions: Array<ParsedTransaction>) => void;
  onCancel: () => void;
  mode: "idle" | "reviewing" | "saving";
};

const enrichDate = (dateStr: string) => {
  if (dateStr.includes("T")) {
    return dateStr;
  }
  const now = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(
    Date.UTC(
      y,
      m - 1,
      d,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    ),
  ).toISOString();
};

function TransactionCard({
  index,
  control,
  errors,
  totalCount,
}: {
  index: number;
  control: Control<TransactionFormData>;
  errors: FieldErrors<TransactionFormData>;
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
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Description</FieldLabel>
          <Input {...control.register(`transactions.${index}.description`)} />
          {errors.transactions?.[index]?.description && (
            <FieldError>{errors.transactions[index].description?.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Amount</FieldLabel>
          <Controller
            control={control}
            name={`transactions.${index}.amount`}
            render={({ field: amountField }) => (
              <Input
                type="number"
                inputMode="decimal"
                value={amountField.value || ""}
                onChange={(e) => amountField.onChange(parseFloat(e.target.value) || 0)}
                onBlur={amountField.onBlur}
                ref={amountField.ref}
              />
            )}
          />
          {errors.transactions?.[index]?.amount && (
            <FieldError>{errors.transactions[index].amount?.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Date</FieldLabel>
          <Controller
            control={control}
            name={`transactions.${index}.date`}
            render={({ field: dateField }) => (
              <DatePicker
                value={dateField.value ? new Date(dateField.value) : undefined}
                onChange={(date) => {
                  if (!date) {
                    dateField.onChange("");
                    return;
                  }
                  dateField.onChange(
                    new Date(
                      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
                    ).toISOString(),
                  );
                }}
              />
            )}
          />
          {errors.transactions?.[index]?.date && (
            <FieldError>{errors.transactions[index].date?.message}</FieldError>
          )}
        </Field>
      </FieldGroup>

      <Field>
        <FieldLabel className="text-sm tracking-wide text-foreground">Type</FieldLabel>
        <Controller
          control={control}
          name={`transactions.${index}.type`}
          render={({ field: typeField }) => (
            <RadioGroup
              value={typeField.value}
              onValueChange={typeField.onChange}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="expense" id={`type-expense-${index}`} />
                <FieldLabel
                  htmlFor={`type-expense-${index}`}
                  className="text-sm tracking-wide text-foreground"
                >
                  Expense
                </FieldLabel>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="income" id={`type-income-${index}`} />
                <FieldLabel
                  htmlFor={`type-income-${index}`}
                  className="text-sm tracking-wide text-foreground"
                >
                  Income
                </FieldLabel>
              </div>
            </RadioGroup>
          )}
        />
      </Field>

      {type === "expense" && (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Category</FieldLabel>
          <Controller
            control={control}
            name={`transactions.${index}.category`}
            render={({ field: catField }) => (
              <ToggleGroup
                value={[catField.value ?? ""]}
                onValueChange={(v) =>
                  catField.onChange((v?.[0] || null) as ParsedTransaction["category"])
                }
                variant="outline"
                className="flex flex-wrap gap-2"
              >
                {CATEGORIES.map(({ value, label }) => {
                  const colors = CATEGORY_COLORS[value];
                  return (
                    <CategoryToggleGroupItem key={value} value={value} colors={colors}>
                      {label}
                    </CategoryToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            )}
          />
        </Field>
      )}
    </Card>
  );
}

function TransactionForm({ initialTransactions, onSave, onCancel, mode }: TransactionFormProps) {
  const now = new Date().toISOString();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactions:
        initialTransactions?.map((t) => ({
          description: t.description,
          amount: t.amount,
          date: t.date ? enrichDate(t.date) : now,
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
            errors={errors}
            totalCount={fields.length}
          />
        ))}
      </div>

      <div className="flex shrink-0 gap-3">
        <Button
          className="flex-1 sm:flex-none"
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={mode === "saving"}
        >
          ← Edit input
        </Button>
        <Button className="flex-1 sm:flex-none" type="submit" disabled={mode === "saving"}>
          {mode === "saving" && <Spinner data-icon="inline-start" />}
          Save Transaction
        </Button>
      </div>
    </form>
  );
}

export { TransactionForm };
