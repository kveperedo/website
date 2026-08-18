import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TRANSACTION_TYPE_COLORS } from "../../../-common/constants";

function NetHeadline() {
  const {
    history: { current },
  } = Route.useLoaderData();
  const isNetPositive = current.net >= 0;
  const netLabel = isNetPositive ? "left" : "over income";
  const netColor = isNetPositive ? TRANSACTION_TYPE_COLORS.income : TRANSACTION_TYPE_COLORS.expense;

  return (
    <p className={cn("font-mono text-lg sm:text-xl", netColor)}>
      {formatCurrency(Math.abs(current.net))} {netLabel}
    </p>
  );
}

function ExpenseBreakdown() {
  const {
    history: { current },
  } = Route.useLoaderData();
  const hasIncome = current.income > 0;

  if (!hasIncome) {
    return (
      <div className="flex flex-col gap-2 font-mono text-xs">
        <p className="text-muted-foreground">No income recorded this month</p>
      </div>
    );
  }

  const expensesRatio = current.expenses / current.income;
  const expensesPercent = Math.round(expensesRatio * 100);

  return (
    <div className="flex flex-col gap-2 font-mono text-xs">
      <p className="text-muted-foreground">
        Expenses are <span className="text-foreground">{expensesPercent}%</span> of income
      </p>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <Progress
          aria-label="Expenses as a percentage of income"
          aria-valuetext={`${expensesPercent}% of income`}
          value={Math.min(expensesPercent, 100)}
          className={cn(
            "w-full **:data-[slot=progress-track]:h-2 sm:flex-1",
            expensesRatio > 1
              ? "**:data-[slot=progress-indicator]:bg-destructive"
              : "**:data-[slot=progress-indicator]:bg-emerald-400",
          )}
        />
        <span className="text-xxs whitespace-nowrap text-muted-foreground">
          {formatCurrency(current.expenses)} / {formatCurrency(current.income)}
        </span>
      </div>
    </div>
  );
}

function PaceComparison() {
  const {
    history: { prior, averagePriorExpenses, priorMonthCount, current },
  } = Route.useLoaderData();
  const paceDiff = averagePriorExpenses !== null ? current.expenses - averagePriorExpenses : null;

  return (
    <>
      <Separator />
      {paceDiff === null ? (
        <p className="text-xs text-muted-foreground">No historical data for comparison</p>
      ) : paceDiff === 0 ? (
        <p className="text-xs text-muted-foreground">
          On pace with your {priorMonthCount}-month average
        </p>
      ) : (
        <p
          className={cn(
            "flex items-center gap-1",
            paceDiff > 0 ? "text-destructive" : "text-emerald-400",
          )}
        >
          {paceDiff > 0 ? (
            <TrendingUpIcon className="size-3 shrink-0" />
          ) : (
            <TrendingDownIcon className="size-3 shrink-0" />
          )}
          <span>
            {formatCurrency(Math.abs(paceDiff))} {paceDiff > 0 ? "above" : "below"}{" "}
            <span className="text-muted-foreground">your {priorMonthCount}-month pace</span>
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-xs">
        {prior.map((month, index) => (
          <span key={month.label} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground/50">·</span>}
            <span className="text-muted-foreground">{month.label.split(" ")[0].slice(0, 3)}</span>
            {month.transactionCount > 0 ? (
              <span className="text-foreground">{formatCurrency(month.expenses)}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        ))}
      </div>
    </>
  );
}

export const SummaryNetCard = () => {
  const {
    history: { current },
  } = Route.useLoaderData();
  const isEmpty = current.transactionCount === 0;

  return (
    <Card size="sm" className="min-w-0 flex-1">
      <CardContent className="flex flex-col gap-2">
        <CardTitle className="text-muted-foreground">
          Your <span className="text-foreground">{current.label}</span> finances so far
        </CardTitle>
        {isEmpty ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No transactions this month.</EmptyTitle>
              <EmptyDescription>Add one to see your summary.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <NetHeadline />
            <ExpenseBreakdown />
            <PaceComparison />
          </>
        )}
      </CardContent>
    </Card>
  );
};
