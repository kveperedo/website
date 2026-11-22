import { ArrowUpRight } from "lucide-react";

import { TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TransactionList } from "../../../-common/components/transaction-list";

export const RecentTransactionsCard = () => {
    const { transactions } = Route.useLoaderData();
    const isTransactionListEmpty = transactions.length === 0;

    return (
        <Card
            data-testid="recent-transactions-card"
            variant="flat"
            className={cn("flex-1 lg:min-h-0 lg:border-0", isTransactionListEmpty && "pt-6")}
        >
            {!isTransactionListEmpty && (
                <CardHeader variant="flat" className="justify-between">
                    <CardTitle variant="flat">Recent transactions</CardTitle>
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
            <CardContent className="min-h-0 p-0 lg:overflow-y-auto">
                {isTransactionListEmpty ? (
                    <div className="px-6 pt-2 pb-6 md:px-8">
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No transactions this month.</EmptyTitle>
                                <EmptyDescription>
                                    Track your spending by adding a transaction.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <TransactionList transactions={transactions} label="Recent transactions" />
                )}
            </CardContent>
        </Card>
    );
};
