import { ArrowUpRight } from "lucide-react";
import { useId } from "react";

import { TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { GridList, GridListItem } from "@/components/ui/grid-list";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TRANSACTION_TYPE_COLORS } from "../../../-common/constants";

type MonthGroupProps<T> = {
  label: string;
  items: ReadonlyArray<T>;
  children: (item: T) => React.ReactNode;
};

function MonthGroup<T>({ label, items, children }: MonthGroupProps<T>) {
  const headingId = useId();

  return (
    <section className="flex flex-col gap-1.5">
      <h3
        id={headingId}
        className="font-mono text-xxs tracking-wider text-muted-foreground uppercase"
      >
        {label}
      </h3>
      <GridList items={items} aria-labelledby={headingId}>
        {children}
      </GridList>
    </section>
  );
}

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
              <MonthGroup key={group.label} label={group.label} items={group.transactions}>
                {(t) => {
                  const day = t.dayOfMonth.toString().padStart(2, "0");
                  const amount = formatCurrency(t.amount, {
                    sign: t.type === "income" ? "positive" : "negative",
                  });

                  return (
                    <GridListItem
                      id={t.id}
                      textValue={`${t.description}, ${amount}`}
                      className="flex min-w-0 items-stretch"
                    >
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
                          {amount}
                        </span>
                      </div>
                    </GridListItem>
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
