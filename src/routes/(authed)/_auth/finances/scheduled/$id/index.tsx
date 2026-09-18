import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { TransactionCategory } from "@/generated/prisma/enums";
import type { ScheduledFormEditData } from "@/schema/scheduled-transaction";

import {
  getScheduledTransactionTemplateByIdFn,
  updateScheduledTransactionTemplateFn,
} from "@/app/finance/scheduled-transactions/functions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  FORM_ID,
  ScheduledTransactionForm,
} from "../-common/components/scheduled-transaction-form";
import { FinanceContainer } from "../../-common/components/finance-container";
import { ArchiveTemplateButton } from "./-common/components/archive-template-button";
import { TemplateSummaryCard } from "./-common/components/template-summary-card";

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/$id/")({
  loader: async ({ params }) => {
    const template = await getScheduledTransactionTemplateByIdFn({ data: params.id });
    return { template };
  },
  head: ({ loaderData }) => {
    const { template } = loaderData!;
    return {
      meta: [
        {
          title: `Edit ${template.description} | Kevin Von Erich Peredo`,
        },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { template } = Route.useLoaderData();
  const updateTemplate = useServerFn(updateScheduledTransactionTemplateFn);
  const [isSaving, setIsSaving] = useState(false);
  const isArchived = template.status === "archived";

  const handleBack = () => {
    router.navigate({ to: "/finances/scheduled" });
  };

  const handleSubmit = async (data: ScheduledFormEditData) => {
    if (isArchived) {
      return;
    }
    setIsSaving(true);
    try {
      await updateTemplate({
        data: {
          id: template.id,
          data: {
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: (data.type === "income" ? null : data.category) as TransactionCategory | null,
            startDate: data.startDate,
            dayOfMonth: data.dayOfMonth,
            endDate: data.endType === "date" ? (data.endDate ?? null) : null,
            maxOccurrences: data.endType === "count" ? (data.maxOccurrences ?? null) : null,
            status: data.status,
          },
        },
      });
      await router.invalidate();
    } finally {
      setIsSaving(false);
    }
  };

  const getEndType = (): ScheduledFormEditData["endType"] => {
    if (template.endDate) {
      return "date";
    }
    if (template.maxOccurrences) {
      return "count";
    }
    return "none";
  };
  const endType = getEndType();

  const buildDefaultValues = (): ScheduledFormEditData => {
    const base = {
      description: template.description,
      amount: template.amount,
      type: template.type,
      category: (template.category ?? null) as TransactionCategory | null,
      startDate: template.startDate,
      dayOfMonth: template.dayOfMonth,
      // Archived templates cannot be edited; form is disabled so status value is irrelevant.
      // Provide a placeholder that satisfies EditableStatusSchema.
      status: (isArchived ? "active" : template.status) as ScheduledFormEditData["status"],
    };
    if (endType === "date") {
      return { ...base, endType, endDate: template.endDate as string };
    }
    if (endType === "count") {
      return { ...base, endType, maxOccurrences: template.maxOccurrences as number };
    }
    return { ...base, endType };
  };
  const defaultValues = buildDefaultValues();

  return (
    <FinanceContainer.Root
      footer={
        <div className="container mx-auto flex h-16 items-center justify-end gap-4 px-4">
          <Button variant="secondary" className="flex-1 sm:flex-none" onPress={handleBack}>
            Cancel
          </Button>
          {!isArchived && (
            <Button
              className="flex-1 sm:flex-none"
              type="submit"
              form={FORM_ID}
              isDisabled={isSaving}
            >
              {isSaving && <Spinner data-icon="inline-start" />}
              Save Changes
            </Button>
          )}
        </div>
      }
    >
      <div className="container mx-auto flex h-full flex-1 flex-col items-center justify-center p-4 sm:py-8">
        {isArchived && (
          <Alert className="mb-4">
            <AlertTitle>Archived</AlertTitle>
            <AlertDescription>This schedule is archived and cannot be edited.</AlertDescription>
          </Alert>
        )}
        <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto sm:flex-row sm:items-start">
          <div className="flex flex-1 flex-col">
            <ScheduledTransactionForm
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isDisabled={isArchived}
            />
          </div>
          <div className="flex flex-col gap-4 sm:shrink-0 sm:basis-xs">
            <TemplateSummaryCard />
            <ArchiveTemplateButton />
          </div>
        </div>
      </div>
    </FinanceContainer.Root>
  );
}
