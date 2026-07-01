import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { getRecentTransactionsFn } from "#/utils/transactions.function";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { CATEGORY_COLORS, CATEGORY_LABELS } from "./-constants";

export const Route = createFileRoute("/(authed)/_auth/finances/")({
  loader: async () => {
    const transactions = await getRecentTransactionsFn();
    const monthLabel = format(new Date(), "MMMM yyyy");
    return { transactions, monthLabel };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { transactions, monthLabel } = Route.useLoaderData();

  const isTransactionListEmpty = transactions.length === 0;

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
        <Card
          className={cn("gap-0 py-0 shadow-xl backdrop-blur", isTransactionListEmpty && "pt-6")}
        >
          {!isTransactionListEmpty && (
            <CardHeader className="px-4 py-4">
              <CardTitle className="font-mono text-sm text-foreground">
                Recent transactions
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-0">
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
              <table className="w-full font-mono text-sm">
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
                          className={cn(
                            "flex min-h-10 flex-col py-1",
                            !t.category && "justify-center",
                          )}
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
                          t.type === "income" ? "text-emerald-400" : "text-destructive",
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
      </div>
    </main>
  );
}
