import { ArrowUpRight } from "lucide-react";

import { TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TRANSACTION_TYPE_COLORS } from "../../../-common/constants";

export const UpcomingTransactionsCard = () => {
  const { upcomingTransactions } = Route.useLoaderData();
  const isEmpty = upcomingTransactions.length === 0;

  return (
    <Card className="flex min-w-0 flex-1 flex-col p-2">
      <CardContent className="flex flex-col gap-2 p-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground">Upcoming transactions</CardTitle>
          <TanstackLinkButton
            variant="ghost"
            size="icon-sm"
            to="/finances/scheduled"
            aria-label="Manage scheduled transactions"
          >
            <ArrowUpRight />
          </TanstackLinkButton>
        </div>
        {isEmpty ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No upcoming transactions.</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingTransactions.map((group) => (
              <section key={group.label} className="flex flex-col gap-1.5" aria-label={group.label}>
                <h3 className="font-mono text-xxs tracking-wider text-muted-foreground uppercase">
                  {group.label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.transactions.map((t) => {
                    const day = t.dayOfMonth.toString().padStart(2, "0");
                    return (
                      <li key={t.id} className="flex min-w-0 items-stretch">
                        <div className="flex size-9 shrink-0 items-center justify-center bg-muted px-2 font-mono text-xs text-foreground tabular-nums">
                          <span aria-hidden="true">{day}</span>
                          <span className="sr-only">Scheduled monthly on day {t.dayOfMonth}</span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 pl-1.5 font-mono text-xs">
                          <span className="truncate text-foreground">{t.description}</span>
                          <span
                            className={cn(
                              "text-xxs",
                              t.type === "income"
                                ? TRANSACTION_TYPE_COLORS.income
                                : TRANSACTION_TYPE_COLORS.expense,
                            )}
                          >
                            {formatCurrency(t.amount, {
                              sign: t.type === "income" ? "positive" : "negative",
                            })}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
