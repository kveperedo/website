"use client";

import { format, parseISO } from "date-fns";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type CommonFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

export const DayOfMonthField = <TFieldValues extends FieldValues>({
  control,
  name,
}: CommonFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field>
            <FieldLabel htmlFor={name} className="text-xs tracking-wide text-foreground">
              Day of month
            </FieldLabel>
            <Input
              id={name}
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={field.value ?? ""}
              onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 0)}
            />
            {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            {field.value > 28 && !fieldState.error && (
              <span className="text-[10px] text-muted-foreground">
                Will generate on the last day for shorter months
              </span>
            )}
          </Field>
        );
      }}
    />
  );
};

export const EndTypeField = <TFieldValues extends FieldValues>({
  control,
  name,
}: CommonFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field>
          <FieldLabel id={`${name}-label`} className="text-xs tracking-wide text-foreground">
            End condition
          </FieldLabel>
          <RadioGroup
            aria-labelledby={`${name}-label`}
            value={field.value}
            onChange={field.onChange}
          >
            <RadioGroupItem value="none">Never</RadioGroupItem>
            <RadioGroupItem value="date">On date</RadioGroupItem>
            <RadioGroupItem value="count">After N occurrences</RadioGroupItem>
          </RadioGroup>
        </Field>
      )}
    />
  );
};

export const EndDateField = <TFieldValues extends FieldValues>({
  control,
  name,
}: CommonFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel className="text-xs tracking-wide text-foreground">End date</FieldLabel>
          <DatePicker
            aria-label="End date"
            value={field.value ? parseISO(field.value) : undefined}
            onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : undefined)}
          />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
};

export const MaxOccurrencesField = <TFieldValues extends FieldValues>({
  control,
  name,
}: CommonFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={name} className="text-xs tracking-wide text-foreground">
            Number of occurrences
          </FieldLabel>
          <Input
            id={name}
            type="number"
            inputMode="numeric"
            min={1}
            value={field.value ?? ""}
            onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 0)}
          />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
};
