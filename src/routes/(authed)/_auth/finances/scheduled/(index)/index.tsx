import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArchiveIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import {
  archiveScheduledTransactionTemplateFn,
  getArchivedScheduledTransactionTemplatesCountFn,
  getScheduledTransactionTemplatesFn,
  toggleScheduledTransactionTemplateFn,
} from "@/app/finance/scheduled-transactions/functions";
import { TanstackLinkButton } from "@/components/ui/button";

import { FinanceContainer } from "../../-common/components/finance-container";
import { SummaryCard } from "../../-common/components/summary-card";
import { ScheduledTransactionList } from "./-common/components/scheduled-transaction-list";

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/(index)/")({
  loader: async () => {
    const [templates, archivedCount] = await Promise.all([
      getScheduledTransactionTemplatesFn(),
      getArchivedScheduledTransactionTemplatesCountFn(),
    ]);
    const active = templates.filter((template) => template.status === "active");
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
    return { templates, archivedCount, summary: { expenses, income } };
  },
  head: () => ({
    meta: [{ title: "Scheduled Transactions | Kevin Von Erich Peredo" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { summary, archivedCount } = Route.useLoaderData();
  const router = useRouter();
  const archiveScheduledTransactionTemplate = useServerFn(archiveScheduledTransactionTemplateFn);
  const toggleScheduledTransactionTemplate = useServerFn(toggleScheduledTransactionTemplateFn);

  const [isArchiving, setIsArchiving] = useState<string | null>(null);
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

  const handleArchive = async (id: string) => {
    setIsArchiving(id);
    try {
      await archiveScheduledTransactionTemplate({ data: id });
      await router.invalidate();
    } finally {
      setIsArchiving(null);
    }
  };

  return (
    <FinanceContainer.Root
      header={
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-medium text-foreground">
            Scheduled Transactions
          </h2>
          <div className="flex items-center gap-2">
            <TanstackLinkButton
              to="/finances/scheduled/archived"
              variant="outline"
              size="sm"
              preload="intent"
            >
              <ArchiveIcon className="size-3.5" />
              Archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
            </TanstackLinkButton>
            <TanstackLinkButton to="/finances/scheduled/new" size="sm" preload="intent">
              <PlusIcon className="size-3.5" />
              New schedule
            </TanstackLinkButton>
          </div>
        </div>
      }
      footer={<FinanceContainer.Footer />}
    >
      <div className="container mx-auto flex flex-1 flex-col gap-2 px-4 py-4 sm:px-0">
        <SummaryCard
          expenses={summary.expenses}
          income={summary.income}
          label="projected monthly"
          testIdPrefix="scheduled-summary"
        />
        <ScheduledTransactionList
          isLoading={isLoading}
          isArchiving={isArchiving}
          onToggle={handleToggleActive}
          onArchive={handleArchive}
        />
      </div>
    </FinanceContainer.Root>
  );
}
