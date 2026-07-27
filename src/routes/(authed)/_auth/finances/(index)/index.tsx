import { createFileRoute, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";

import type { TransactionItemAIType } from "@/schema/transaction";

import { BackButton } from "@/components/back-button";
import {
  generateScheduledTransactionsFn,
  getUpcomingScheduledTransactionTemplatesFn,
} from "@/utils/scheduled-transactions.functions";
import {
  getCategorySummaryFn,
  getMonthlySummaryFn,
  getRecentTransactionsFn,
} from "@/utils/transactions.function";

import { TransactionInput } from "../-common/components/transaction-input";
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
  const router = useRouter();
  const { monthLabel } = Route.useLoaderData();

  const handleParsed = (transactions: Array<TransactionItemAIType>) => {
    router.navigate({
      to: "/finances/transactions/new",
      search: { transactions, returnTo: "/finances" },
    });
  };

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <div className="container mx-auto max-w-2xl p-4 pb-0">
        <div className="flex items-center gap-2">
          <BackButton variant="icon" to="/" />
          <h1 className="font-heading text-lg text-foreground">{monthLabel}</h1>
        </div>
      </div>

      <div className="container mx-auto my-4 flex max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-4 pb-8">
        <div className="flex gap-4">
          <SummaryNetCard />
          <UpcomingTransactionsCard />
        </div>
        <RecentTransactionsCard />
        <CategorySummaryCard />
      </div>

      <div className="container mx-auto max-w-2xl px-4 pb-6">
        <TransactionInput onParsed={handleParsed} />
      </div>
    </main>
  );
}
