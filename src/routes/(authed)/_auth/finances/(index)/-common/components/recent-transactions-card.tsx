import { ArrowUpRight } from "lucide-react";

import { TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TransactionTable } from "../../../-common/components/transaction-table";

export const RecentTransactionsCard = () => {
  const { transactions } = Route.useLoaderData();
  const isTransactionListEmpty = transactions.length === 0;

  return (
    <Card className={cn("gap-0 py-0", isTransactionListEmpty && "pt-6")}>
      {!isTransactionListEmpty && (
        <CardHeader className="flex flex-row items-center justify-between px-4 py-4">
          <CardTitle className="font-mono text-sm text-foreground">Recent transactions</CardTitle>
          <TanstackLinkButton
            to="/finances/transactions"
            variant="ghost"
            size="icon-sm"
            aria-label="View all transactions"
          >
            <ArrowUpRight />
          </TanstackLinkButton>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {isTransactionListEmpty ? (
          <div className="px-6 pt-2 pb-6 md:px-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No transactions this month.</EmptyTitle>
                <EmptyDescription>Track your spending by adding a transaction.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <TransactionTable transactions={transactions} label="Recent transactions" />
        )}
      </CardContent>
    </Card>
  );
};
