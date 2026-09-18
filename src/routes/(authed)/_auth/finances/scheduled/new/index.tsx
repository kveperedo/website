import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { TransactionCategory } from "@/generated/prisma/enums";
import type { ScheduledFormEditData } from "@/schema/scheduled-transaction";

import { todayDateOnly } from "@/app/finance/local-date";
import { createStandaloneScheduledTemplateFn } from "@/app/finance/scheduled-transactions/functions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  FORM_ID,
  ScheduledTransactionForm,
} from "../-common/components/scheduled-transaction-form";
import { FinanceContainer } from "../../-common/components/finance-container";

const DEFAULT_VALUES: ScheduledFormEditData = {
  description: "",
  amount: 0,
  type: "expense",
  category: null,
  startDate: todayDateOnly(),
  dayOfMonth: new Date().getDate(),
  endType: "none",
  status: "active",
};

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/new/")({
  head: () => ({
    meta: [{ title: "New Scheduled Transaction | Kevin Von Erich Peredo" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const createTemplate = useServerFn(createStandaloneScheduledTemplateFn);
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    router.navigate({ to: "/finances/scheduled" });
  };

  const handleSubmit = async (data: ScheduledFormEditData) => {
    setIsSaving(true);
    try {
      await createTemplate({
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
      });
      await router.invalidate({ sync: true });
      router.navigate({ to: "/finances/scheduled" });
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
            Create Schedule
          </Button>
        </div>
      }
    >
      <div className="container mx-auto flex h-full flex-1 flex-col items-center justify-center p-4 sm:py-8">
        <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto sm:flex-row sm:items-start">
          <div className="flex flex-1 flex-col">
            <ScheduledTransactionForm defaultValues={DEFAULT_VALUES} onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </FinanceContainer.Root>
  );
}
