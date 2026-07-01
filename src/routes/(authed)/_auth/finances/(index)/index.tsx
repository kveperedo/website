import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { getMonthlySummaryFn, getRecentTransactionsFn } from "#/utils/transactions.function";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";

import { RecentTransactionsCard } from "./-components/recent-transactions-card";
import { SummaryNetCard } from "./-components/summary-net-card";

export const Route = createFileRoute("/(authed)/_auth/finances/(index)/")({
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
  const { monthLabel } = Route.useLoaderData();

  return (
    <main className="relative flex h-screen flex-col">
      <div className="container mx-auto max-w-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton to="/" variant="icon" />
            <h1 className="font-heading text-lg text-foreground">{monthLabel}</h1>
          </div>
          <Button nativeButton={false} render={<Link to="/finances/new" />}>
            New transaction
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl flex-1 overflow-y-auto px-4 pb-8">
        <SummaryNetCard />
        <RecentTransactionsCard />
      </div>
    </main>
  );
}
