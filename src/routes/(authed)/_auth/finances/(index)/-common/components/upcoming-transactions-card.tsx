import { ArrowUpRight } from "lucide-react";
import { useId } from "react";

import { TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <h3 id={headingId} className="text-xxs tracking-wider text-muted-foreground uppercase">
        {label}
      </h3>
      <GridList items={items} aria-labelledby={headingId} className="gap-0 divide-y divide-subtle">
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
      <CardContent className="flex min-h-0 flex-col gap-2 p-3 lg:overflow-y-auto">
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
                      className="flex min-w-0 items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center bg-muted font-mono text-xs text-foreground">
                        <span aria-hidden="true">{day}</span>
                        <span className="sr-only">Scheduled monthly on day {t.dayOfMonth}</span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 text-xs">
                        <span className="truncate text-foreground">{t.description}</span>
                        <span
                          className={cn(
                            "font-mono text-xxs",
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
