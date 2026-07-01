import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "#/components/ui/empty";
import { cn } from "#/lib/utils";

import { Route } from "..";
import { CATEGORY_COLORS, CATEGORY_LABELS, TRANSACTION_TYPE_COLORS } from "../../-constants";

export const RecentTransactionsCard = () => {
  const { transactions } = Route.useLoaderData();
  const isTransactionListEmpty = transactions.length === 0;

  return (
    <Card className={cn("gap-0 py-0", isTransactionListEmpty && "pt-6")}>
      {!isTransactionListEmpty && (
        <CardHeader className="px-4 py-4">
          <CardTitle className="font-mono text-sm text-foreground">Recent transactions</CardTitle>
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
          <table className="w-full font-mono text-sm" aria-label="Recent transactions">
            <thead className="sr-only">
              <tr>
                <th scope="col">Description</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr
                  key={t.id}
                  className={cn(
                    "border-l-2",
                    t.category ? CATEGORY_COLORS[t.category].border : "border-l-transparent",
                    i % 2 === 0 && "bg-muted/30",
                  )}
                >
                  <td className="px-4 text-foreground">
                    <div
                      className={cn("flex min-h-10 flex-col py-1", !t.category && "justify-center")}
                    >
                      <span className="leading-5">{t.description}</span>
                      {t.category && (
                        <span className="text-[10px]/3 text-muted-foreground">
                          {CATEGORY_LABELS[t.category]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={cn(
                      "py-0.5 pr-4 text-right text-xs font-medium whitespace-nowrap",
                      t.type === "income"
                        ? TRANSACTION_TYPE_COLORS.income
                        : TRANSACTION_TYPE_COLORS.expense,
                    )}
                  >
                    {t.type === "income" ? "+" : "-"}₱
                    {t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};
