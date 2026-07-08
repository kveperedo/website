"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup } from "@/components/ui/toggle-group";

import { CATEGORIES, CATEGORY_COLORS } from "../constants";
import { CategoryToggleGroupItem } from "./category-toggle";

function DescriptionField<TFieldValues extends FieldValues>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Description</FieldLabel>
          <Input {...field} />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
}

function AmountField<TFieldValues extends FieldValues>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Amount</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={field.value || ""}
            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            onBlur={field.onBlur}
            ref={field.ref}
          />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
}

function DateField<TFieldValues extends FieldValues>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Date</FieldLabel>
          <DatePicker
            value={field.value ? new Date(field.value) : undefined}
            onChange={(date) => {
              if (!date) {
                field.onChange("");
                return;
              }
              field.onChange(
                new Date(
                  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
                ).toISOString(),
              );
            }}
          />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
}

function TypeField<TFieldValues extends FieldValues>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: typeField, fieldState }) => (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Type</FieldLabel>
          <RadioGroup
            value={typeField.value}
            onValueChange={typeField.onChange}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="expense" id={`${name}-expense`} />
              <FieldLabel
                htmlFor={`${name}-expense`}
                className="text-sm tracking-wide text-foreground"
              >
                Expense
              </FieldLabel>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="income" id={`${name}-income`} />
              <FieldLabel
                htmlFor={`${name}-income`}
                className="text-sm tracking-wide text-foreground"
              >
                Income
              </FieldLabel>
            </div>
          </RadioGroup>
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
}

function CategoryField<TFieldValues extends FieldValues>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: catField, fieldState }) => (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Category</FieldLabel>
          <ToggleGroup
            value={[catField.value ?? ""]}
            onValueChange={(v) => catField.onChange((v?.[0] || null) as TransactionCategory)}
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
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
}

export { DescriptionField, AmountField, DateField, TypeField, CategoryField };
