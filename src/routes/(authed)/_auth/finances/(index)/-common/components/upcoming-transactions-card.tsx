import { ArrowUpRight } from "lucide-react";
import { useId } from "react";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { GridList } from "@/components/ui/grid-list";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TransactionListItem } from "../../../-common/components/transaction-list-item";

type MonthGroupProps<T> = {
    label: string;
    items: ReadonlyArray<T>;
    showBorder?: boolean;
    children: (item: T) => React.ReactNode;
};

function MonthGroup<T>({ label, items, showBorder = false, children }: MonthGroupProps<T>) {
    const headingId = useId();

    return (
        <section
            className={cn("flex flex-col gap-1.5", showBorder && "border-t border-subtle pt-3")}
        >
            <h3
                id={headingId}
                className="px-3 text-xxs tracking-wider text-muted-foreground uppercase"
            >
                {label}
            </h3>
            <GridList
                items={items}
                aria-labelledby={headingId}
                className="gap-0 divide-y divide-subtle border-t border-subtle"
            >
                {children}
            </GridList>
        </section>
    );
}

export const UpcomingTransactionsCard = () => {
    const { upcomingTransactions } = Route.useLoaderData();
    const isEmpty = upcomingTransactions.length === 0;

    return (
        <Card variant="flat" className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:border-0">
            <CardHeader variant="flat" className="justify-between">
                <CardTitle variant="flat">Upcoming transactions</CardTitle>
                <TanstackLinkButton
                    variant="ghost"
                    size="icon-sm"
                    to="/finances/scheduled"
                    aria-label="Manage scheduled transactions"
                >
                    <ArrowUpRight />
                </TanstackLinkButton>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-col gap-2 px-0 py-3 lg:overflow-y-auto">
                {isEmpty ? (
                    <div className="px-3">
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No upcoming transactions.</EmptyTitle>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {upcomingTransactions.map((group, index) => (
                            <MonthGroup
                                key={group.label}
                                label={group.label}
                                items={group.transactions}
                                showBorder={index > 0}
                            >
                                {(t) => {
                                    const day = t.dayOfMonth.toString().padStart(2, "0");
                                    const formattedAmount = formatCurrency(t.amount, {
                                        sign: t.type === "income" ? "positive" : "negative",
                                    });

                                    return (
                                        <TransactionListItem
                                            id={t.id}
                                            day={day}
                                            textValue={`${group.label} ${day}, ${t.description}, ${formattedAmount}`}
                                            amount={t.amount}
                                            type={t.type}
                                            category={t.category as TransactionCategory | null}
                                        >
                                            <span className="min-w-0 flex-1 truncate">
                                                {t.description}
                                            </span>
                                        </TransactionListItem>
                                    );
                                }}
                            </MonthGroup>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
