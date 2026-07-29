import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import {
  generateScheduledTransactionsFn,
  getUpcomingScheduledTransactionTemplatesFn,
} from "@/utils/scheduled-transactions.functions";
import {
  getCategorySummaryFn,
  getMonthlySummaryFn,
  getRecentTransactionsFn,
} from "@/utils/transactions.function";

import { FinanceContainer } from "../-common/components/finance-container";
import { CategorySummaryCard } from "./-common/components/category-summary-card";
import { RecentTransactionsCard } from "./-common/components/recent-transactions-card";
import { SummaryNetCard } from "./-common/components/summary-net-card";
import { UpcomingTransactionsCard } from "./-common/components/upcoming-transactions-card";

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Finances | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(authed)/_auth/finances/(index)/")({
  head: () => ({ meta: META }),
  loader: async () => {
    await generateScheduledTransactionsFn();
    const [transactions, summary, categorySummary, upcomingTransactions] = await Promise.all([
      getRecentTransactionsFn(),
      getMonthlySummaryFn(),
      getCategorySummaryFn(),
      getUpcomingScheduledTransactionTemplatesFn(),
    ]);
    const monthLabel = format(new Date(), "MMMM yyyy");
    return { transactions, summary, categorySummary, upcomingTransactions, monthLabel };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { monthLabel } = Route.useLoaderData();

  return (
    <FinanceContainer.Root footer={<FinanceContainer.Footer />}>
      <div className="container mx-auto flex flex-1 flex-col gap-4 p-4">
        <h2 className="sr-only">{monthLabel}</h2>
        <div className="flex gap-4">
          <SummaryNetCard />
          <UpcomingTransactionsCard />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <RecentTransactionsCard />
          <CategorySummaryCard />
        </div>
      </div>
    </FinanceContainer.Root>
  );
}
