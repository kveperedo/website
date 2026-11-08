"use client";

import { format, parseISO } from "date-fns";
import { useId } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { ApplicationFields } from "@/app/applications/applications.schema";
import type { ApplicationStatus } from "@/generated/prisma/enums";

import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayDateOnly } from "@/lib/date-only";

import { ApplicationStatusOptions } from "./application-status-options";

type ApplicationFieldProps = {
  isDisabled?: boolean;
};

type TextInputFieldProps = ApplicationFieldProps & {
  name: "position" | "company" | "link";
  label: string;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
};

const ApplicationTextInput = ({
  name,
  label,
  placeholder,
  type,
  isDisabled,
}: TextInputFieldProps) => {
  const form = useFormContext<ApplicationFields>();
  const fieldId = useId();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={fieldId} className="text-sm tracking-wide text-foreground">
            {label}
          </FieldLabel>
          <Input
            id={fieldId}
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={isDisabled}
          />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
};

export const PositionTextField = ({ isDisabled }: ApplicationFieldProps) => {
  return (
    <ApplicationTextInput
      name="position"
      label="Position"
      placeholder="Senior Frontend Engineer"
      isDisabled={isDisabled}
    />
  );
};

export const CompanyTextField = ({ isDisabled }: ApplicationFieldProps) => {
  return (
    <ApplicationTextInput
      name="company"
      label="Company"
      placeholder="Acme"
      isDisabled={isDisabled}
    />
  );
};

export const LinkTextField = ({ isDisabled }: ApplicationFieldProps) => {
  return (
    <ApplicationTextInput
      name="link"
      label="Job listing link"
      type="url"
      placeholder="https://example.com/jobs/1"
      isDisabled={isDisabled}
    />
  );
};

export const NotesTextareaField = ({ isDisabled }: ApplicationFieldProps) => {
  const form = useFormContext<ApplicationFields>();
  const fieldId = useId();

  return (
    <Controller
      control={form.control}
      name="notes"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={fieldId} className="text-sm tracking-wide text-foreground">
            Notes
          </FieldLabel>
          <Textarea
            id={fieldId}
            {...field}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(event) =>
              field.onChange(event.target.value === "" ? null : event.target.value)
            }
            placeholder="Recruiter name, interview details, or anything worth remembering."
            rows={4}
            disabled={isDisabled}
          />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
};

export const ApplicationStatusField = ({ isDisabled }: ApplicationFieldProps) => {
  const form = useFormContext<ApplicationFields>();

  return (
    <Controller
      control={form.control}
      name="status"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Status</FieldLabel>
          <Select
            selectedKey={field.value}
            onSelectionChange={(key) => {
              if (!key) {
                return;
              }

              const next = key as ApplicationStatus;

              field.onChange(next);

              if (next === "saved") {
                form.setValue("appliedAt", null, { shouldValidate: true });
              } else if (!form.getValues("appliedAt")) {
                form.setValue("appliedAt", todayDateOnly(), { shouldValidate: true });
              }
            }}
            isDisabled={isDisabled}
            aria-label="Status"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <ApplicationStatusOptions />
            </SelectContent>
          </Select>
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
};

export const ApplicationAppliedAtField = ({ isDisabled }: ApplicationFieldProps) => {
  const form = useFormContext<ApplicationFields>();
  const status = useWatch({ control: form.control, name: "status" });

  if (status === "saved") {
    return null;
  }

  return (
    <Controller
      control={form.control}
      name="appliedAt"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel className="text-sm tracking-wide text-foreground">Applied date</FieldLabel>
          <DatePicker
            aria-label="Applied date"
            isDisabled={isDisabled}
            value={field.value ? parseISO(field.value) : undefined}
            onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
          />
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
};
