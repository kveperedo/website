import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  deleteScheduledTransactionTemplateFn,
  getScheduledTransactionTemplatesFn,
  toggleScheduledTransactionTemplateFn,
} from "@/app/finance/scheduled-transactions/functions";

import { ScheduledTransactionList } from "../-common/components/scheduled-transaction-list";
import { FinanceContainer } from "../../-common/components/finance-container";
import { SummaryCard } from "../../-common/components/summary-card";

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/(index)/")({
  loader: async () => {
    const templates = await getScheduledTransactionTemplatesFn();
    const active = templates.filter((template) => template.isActive);
    const { expenses, income } = active.reduce(
      (acc, template) => {
        if (template.type === "expense") {
          acc.expenses += template.amount;
        } else {
          acc.income += template.amount;
        }
        return acc;
      },
      { expenses: 0, income: 0 },
    );
    return { templates, summary: { expenses, income } };
  },
  head: () => ({
    meta: [{ title: "Scheduled Transactions | Kevin Von Erich Peredo" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { summary } = Route.useLoaderData();
  const router = useRouter();
  const deleteScheduledTransactionTemplate = useServerFn(deleteScheduledTransactionTemplateFn);
  const toggleScheduledTransactionTemplate = useServerFn(toggleScheduledTransactionTemplateFn);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleToggleActive = async (id: string) => {
    setIsLoading(id);
    try {
      await toggleScheduledTransactionTemplate({ data: id });
      await router.invalidate();
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteScheduledTransactionTemplate({ data: id });
      await router.invalidate();
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <FinanceContainer.Root footer={<FinanceContainer.Footer />}>
      <div className="container mx-auto flex flex-1 flex-col gap-2 px-4 py-4">
        <h2 className="sr-only">Scheduled Transactions</h2>
        <SummaryCard
          expenses={summary.expenses}
          income={summary.income}
          label="projected monthly"
          testIdPrefix="scheduled-summary"
        />
        <ScheduledTransactionList
          isLoading={isLoading}
          isDeleting={isDeleting}
          onToggle={handleToggleActive}
          onDelete={handleDelete}
        />
      </div>
    </FinanceContainer.Root>
  );
}
