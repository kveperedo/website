import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TRANSACTION_TYPE_COLORS } from "../../../-common/constants";

export const SummaryNetCard = () => {
  const { summary, monthLabel } = Route.useLoaderData();
  const isEmpty = summary.transactionCount === 0;

  return (
    <Card className={cn("min-w-0 flex-1 p-2", isEmpty && "py-6")}>
      <CardContent className="flex flex-col gap-1 p-2">
        <p className="font-mono text-xs text-muted-foreground">{monthLabel}</p>
        {isEmpty ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No transactions this month.</EmptyTitle>
              <EmptyDescription>Add one to see your summary.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <p
              className={cn(
                "font-mono text-xl font-medium",
                summary.net >= 0 ? TRANSACTION_TYPE_COLORS.income : TRANSACTION_TYPE_COLORS.expense,
              )}
            >
              ₱{Math.abs(summary.net).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <div>
                <p className="text-muted-foreground">Income:</p>
                <p className="text-foreground">
                  ₱{summary.income.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Expenses:</p>
                <p className="text-foreground">
                  ₱{summary.expenses.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
