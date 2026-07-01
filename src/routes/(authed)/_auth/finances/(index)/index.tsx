import { createFileRoute, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";

import type { TransactionItemAIType } from "#/schema/transaction";

import { getMonthlySummaryFn, getRecentTransactionsFn } from "#/utils/transactions.function";
import { BackButton } from "@/components/back-button";

import { TransactionInput } from "../-components/transaction-input";
import { RecentTransactionsCard } from "./-components/recent-transactions-card";
import { SummaryNetCard } from "./-components/summary-net-card";

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Finances | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(authed)/_auth/finances/(index)/")({
  head: () => ({ meta: META }),
  loader: async () => {
    const [transactions, summary] = await Promise.all([
      getRecentTransactionsFn(),
      getMonthlySummaryFn(),
    ]);
    const monthLabel = format(new Date(), "MMMM yyyy");
    return { transactions, summary, monthLabel };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { monthLabel } = Route.useLoaderData();

  const handleParsed = (transactions: Array<TransactionItemAIType>) => {
    router.navigate({
      to: "/finances/new",
      search: { transactions },
    });
  };

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <div className="container mx-auto max-w-2xl p-4 pb-0">
        <div className="flex items-center gap-2">
          <BackButton to="/" variant="icon" />
          <h1 className="font-heading text-lg text-foreground">{monthLabel}</h1>
        </div>
      </div>

      <div className="container mx-auto my-4 max-w-2xl flex-1 overflow-y-auto px-4 pb-8">
        <SummaryNetCard />
        <RecentTransactionsCard />
      </div>

      <div className="container mx-auto max-w-2xl px-4 pb-6">
        <TransactionInput onParsed={handleParsed} />
      </div>
    </main>
  );
}
