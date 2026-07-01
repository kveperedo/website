import { Card, CardContent } from "#/components/ui/card";
import { cn } from "#/lib/utils";

import { Route } from "../..";
import { TRANSACTION_TYPE_COLORS } from "../../../-common/constants";

export const SummaryNetCard = () => {
  const { summary } = Route.useLoaderData();
  const isEmpty = summary.transactionCount === 0;

  if (isEmpty) {
    return null;
  }

  return (
    <Card className="w-1/2 p-2">
      <CardContent className="flex flex-col gap-1 p-2">
        <p className="font-mono text-xs text-muted-foreground">
          {summary.transactionCount} transactions
        </p>
        <p
          className={cn(
            "font-heading text-2xl font-medium",
            summary.net >= 0 ? TRANSACTION_TYPE_COLORS.income : TRANSACTION_TYPE_COLORS.expense,
          )}
        >
          ₱{Math.abs(summary.net).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-4 font-mono text-xs text-muted-foreground">
          <span>
            Income: ₱{summary.income.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
          <span>
            Expenses: ₱{summary.expenses.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
