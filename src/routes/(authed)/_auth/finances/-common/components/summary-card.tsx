import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { TRANSACTION_TYPE_COLORS } from "../constants";

type SummaryCardProps = {
  expenses: number;
  income: number;
  label: string;
  expensesDimmed?: boolean;
  incomeDimmed?: boolean;
  testIdPrefix?: string;
};

export function SummaryCard({
  expenses,
  income,
  label,
  expensesDimmed = false,
  incomeDimmed = false,
  testIdPrefix = "transaction-summary",
}: SummaryCardProps) {
  return (
    <Card data-testid={testIdPrefix} size="sm" className="gap-0 py-0">
      <CardContent className="p-0">
        <dl
          className="grid grid-cols-2 divide-x divide-border"
          aria-label={`Financial summary for ${label}`}
        >
          <div
            data-testid={`${testIdPrefix}-expenses-panel`}
            data-dimmed={expensesDimmed ? "" : undefined}
            aria-disabled={expensesDimmed || undefined}
            className={cn(
              "min-w-0 px-3 py-2 transition-opacity duration-200 sm:px-4",
              expensesDimmed && "opacity-50",
            )}
          >
            <dt className="text-muted-foreground">Expenses</dt>
            <dd
              data-testid={`${testIdPrefix}-expenses`}
              className={cn(
                "mt-1 font-mono text-sm font-medium break-all sm:text-base",
                TRANSACTION_TYPE_COLORS.expense,
              )}
            >
              {formatCurrency(expenses)}
            </dd>
          </div>
          <div
            data-testid={`${testIdPrefix}-income-panel`}
            data-dimmed={incomeDimmed ? "" : undefined}
            aria-disabled={incomeDimmed || undefined}
            className={cn(
              "min-w-0 px-3 py-2 transition-opacity duration-200 sm:px-4",
              incomeDimmed && "opacity-50",
            )}
          >
            <dt className="text-muted-foreground">Income</dt>
            <dd
              data-testid={`${testIdPrefix}-income`}
              className={cn(
                "mt-1 font-mono text-sm font-medium break-all sm:text-base",
                TRANSACTION_TYPE_COLORS.income,
              )}
            >
              {formatCurrency(income)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
