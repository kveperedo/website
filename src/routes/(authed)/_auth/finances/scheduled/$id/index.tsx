import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { TransactionCategory } from "@/generated/prisma/enums";
import type { ScheduledFormEditData } from "@/schema/scheduled-transaction";

import {
  getScheduledTransactionTemplateByIdFn,
  updateScheduledTransactionTemplateFn,
} from "@/app/finance/scheduled-transactions/functions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { FinanceContainer } from "../../-common/components/finance-container";
import { EditScheduledForm, FORM_ID } from "./-common/components/edit-scheduled-form";

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

  const handleBack = () => {
    router.navigate({ to: "/finances/scheduled" });
  };

  const handleSubmit = async (data: ScheduledFormEditData) => {
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
            dayOfMonth: data.dayOfMonth,
            endDate: data.endType === "date" ? (data.endDate ?? null) : null,
            maxOccurrences: data.endType === "count" ? (data.maxOccurrences ?? null) : null,
            isActive: data.isActive,
          },
        },
      });
      await router.invalidate();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FinanceContainer.Root
      footer={
        <div className="container mx-auto flex h-16 items-center justify-end gap-4 px-4">
          <Button variant="secondary" className="flex-1 sm:flex-none" onPress={handleBack}>
            Cancel
          </Button>
          <Button
            className="flex-1 sm:flex-none"
            type="submit"
            form={FORM_ID}
            isDisabled={isSaving}
          >
            {isSaving && <Spinner data-icon="inline-start" />}
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="container mx-auto flex h-full flex-1 flex-col items-center justify-center p-4 sm:py-8">
        <EditScheduledForm onSubmit={handleSubmit} />
      </div>
    </FinanceContainer.Root>
  );
}
