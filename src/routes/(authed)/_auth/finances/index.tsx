import { Link, createFileRoute } from "@tanstack/react-router";

import { getTransactionsFn } from "#/utils/transactions.function";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CATEGORY_LABELS, CATEGORY_COLORS } from "./-constants";

export const Route = createFileRoute("/(authed)/_auth/finances/")({
  loader: async () => {
    const transactions = await getTransactionsFn();
    return { transactions };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { transactions } = Route.useLoaderData();

  return (
    <main className="relative min-h-screen bg-background bg-scanlines">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-3xl text-foreground">finances</h1>
          <Button render={<Link to="/finances/new" />}>New Transaction</Button>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded border border-border bg-card px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-foreground">{t.description}</span>
                  {t.category && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        CATEGORY_COLORS[t.category]?.bg,
                        CATEGORY_COLORS[t.category]?.text,
                      )}
                    >
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    t.type === "income" ? "text-emerald-400" : "text-destructive",
                  )}
                >
                  {t.type === "income" ? "+" : "-"}₱
                  {t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
