"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import type { ApplicationFields } from "@/app/applications/applications.schema";

import { ApplicationFieldsSchema } from "@/app/applications/applications.schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export const FORM_ID = "application-form";

export type ApplicationFormRenderProps = {
  isDisabled?: boolean;
};

type ApplicationFormProps = {
  defaultValues: ApplicationFields;
  onSubmit: (data: ApplicationFields) => Promise<void>;
  /** Values to restore after a successful submit. Defaults to the submitted values. */
  resetTo?: ApplicationFields;
  isDisabled?: boolean;
  formId?: string;
  className?: string;
  children: (props: ApplicationFormRenderProps) => ReactNode;
};

export function ApplicationForm({
  defaultValues,
  onSubmit,
  resetTo,
  isDisabled,
  formId = FORM_ID,
  className,
  children,
}: ApplicationFormProps) {
  const form = useForm<ApplicationFields>({
    resolver: zodResolver(ApplicationFieldsSchema),
    defaultValues,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSave = async (data: ApplicationFields) => {
    setSubmitError(null);

    try {
      await onSubmit(data);
      form.reset(resetTo ?? data);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save the application. Try again.",
      );
    }
  };

  return (
    <FormProvider {...form}>
      <form
        id={formId}
        noValidate
        onSubmit={form.handleSubmit(handleSave)}
        className={cn("flex w-full flex-col gap-4", className)}
      >
        {submitError && (
          <Alert variant="destructive">
            <AlertTitle>Could not save the application</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {children({ isDisabled })}
      </form>
    </FormProvider>
  );
}
