import { useServerFn } from "@tanstack/react-start";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { setHideSummaryCardAmountsFn } from "@/app/finance/preferences/preferences.functions";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { TRANSACTION_TYPE_COLORS } from "../../../-common/constants";
import { getExpenseProgress } from "../expense-progress";
import { formatAmount } from "../format-amount";
import { AmountsVisibilityToggle } from "./amounts-visibility";

type AmountVisibilityProps = { hideAmounts: boolean };

function NetHeadline({ hideAmounts }: AmountVisibilityProps) {
  const {
    history: { current },
  } = Route.useLoaderData();
  const isNetPositive = current.net >= 0;
  const netLabel = isNetPositive ? "left" : "over income";
  const netColor = isNetPositive ? TRANSACTION_TYPE_COLORS.income : TRANSACTION_TYPE_COLORS.expense;

  return (
    <p data-testid="net-headline" className={cn("font-mono text-lg sm:text-xl", netColor)}>
      {formatAmount(Math.abs(current.net), { hidden: hideAmounts })} {netLabel}
    </p>
  );
}

function hasScheduledProjection(projection: { scheduledCount: number; scheduledExpenses: number }) {
  return projection.scheduledCount > 0 && projection.scheduledExpenses > 0;
}

function ExpenseProgress() {
  const {
    history: { current },
    scheduledProjection,
  } = Route.useLoaderData();
  if (!Number.isFinite(current.income) || current.income <= 0) {
    return null;
  }
  const hasScheduled = hasScheduledProjection(scheduledProjection);
  const {
    expensesPercent,
    projectedPercent,
    actualBarPercent,
    scheduledBarPercent,
    isOverIncome,
    isProjectedOverIncome,
  } = getExpenseProgress(current.income, current.expenses, scheduledProjection.scheduledExpenses);

  const remainingPercent = Math.max(
    100 - actualBarPercent - (hasScheduled ? scheduledBarPercent : 0),
    0,
  );
  const EMERALD = "var(--color-emerald-400)";
  const DESTRUCTIVE = "var(--destructive)";
  const actualFill = isOverIncome ? DESTRUCTIVE : EMERALD;
  const scheduledFill = isProjectedOverIncome ? DESTRUCTIVE : EMERALD;
  const scheduledOpacity = isProjectedOverIncome ? "40%" : "35%";
  const scheduledTranslucent = `color-mix(in oklab, ${scheduledFill} ${scheduledOpacity}, transparent)`;
  const hatchImage = `repeating-linear-gradient(45deg, transparent 0 4px, color-mix(in oklab, var(--foreground) 14%, transparent) 4px 8px)`;

  return (
    <div
      role="progressbar"
      aria-label={
        hasScheduled
          ? "Expenses as a percentage of income including scheduled"
          : "Expenses as a percentage of income"
      }
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(hasScheduled ? projectedPercent : expensesPercent, 100)}
      aria-valuetext={
        hasScheduled
          ? `${expensesPercent}% of income, ${projectedPercent}% with scheduled`
          : `${expensesPercent}% of income`
      }
      data-testid={hasScheduled ? "expense-progress-projected" : "expense-progress-single"}
      className={cn("flex h-2 w-full overflow-hidden rounded-none sm:flex-1")}
    >
      <div
        data-testid="expense-progress-actual"
        style={{ width: `${actualBarPercent}%`, background: actualFill }}
        className="h-full shrink-0 transition-all duration-300"
      />
      {hasScheduled && scheduledBarPercent > 0 ? (
        <div
          data-testid="expense-progress-scheduled"
          style={{
            width: `${scheduledBarPercent}%`,
            backgroundColor: scheduledTranslucent,
            backgroundImage: hatchImage,
          }}
          data-fill={scheduledFill}
          data-opacity={scheduledOpacity}
          className="h-full shrink-0 transition-all duration-300"
        />
      ) : null}
      <div
        data-testid="expense-progress-remaining"
        style={{ width: `${remainingPercent}%` }}
        className="h-full shrink-0 bg-muted transition-all duration-300"
      />
    </div>
  );
}

function ExpenseBreakdown({ hideAmounts }: AmountVisibilityProps) {
  const {
    history: { current },
    scheduledProjection,
  } = Route.useLoaderData();
  const hasIncome = current.income > 0;

  if (!hasIncome) {
    return (
      <div className="flex flex-col gap-2 font-mono text-xs">
        <p className="text-muted-foreground">No income recorded this month</p>
      </div>
    );
  }

  const hasScheduled = hasScheduledProjection(scheduledProjection);
  const { expensesPercent } = getExpenseProgress(
    current.income,
    current.expenses,
    scheduledProjection.scheduledExpenses,
  );
  const currentLabel = formatAmount(current.expenses, { hidden: hideAmounts });
  const incomeLabel = formatAmount(current.income, { hidden: hideAmounts });
  const scheduledLabel = formatAmount(scheduledProjection.scheduledExpenses, {
    hidden: hideAmounts,
  });

  return (
    <div className="flex flex-col gap-2 font-mono text-xs">
      <p className="text-muted-foreground">
        Expenses are <span className="text-foreground">{expensesPercent}%</span> of income
      </p>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <ExpenseProgress />
        <span
          data-testid="expense-breakdown-label"
          className="text-xxs whitespace-nowrap text-muted-foreground tabular-nums"
        >
          <span data-testid="expense-breakdown-current" className="text-foreground">
            {currentLabel}
          </span>
          {hasScheduled ? (
            <span
              data-testid="expense-breakdown-scheduled"
              title="Plus scheduled expenses remaining this month"
            >
              {` (+${scheduledLabel})`}
            </span>
          ) : null}
          {` / ${incomeLabel}`}
        </span>
      </div>
    </div>
  );
}

function PaceComparison({ hideAmounts }: AmountVisibilityProps) {
  const {
    history: { prior, averagePriorExpenses, priorMonthCount, current },
  } = Route.useLoaderData();
  const paceDiff = averagePriorExpenses !== null ? current.expenses - averagePriorExpenses : null;

  const renderPaceMessage = () => {
    if (paceDiff === null) {
      return <p className="text-xs text-muted-foreground">No historical data for comparison</p>;
    }
    if (paceDiff === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          On pace with your {priorMonthCount}-month average
        </p>
      );
    }
    return (
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
          {formatAmount(Math.abs(paceDiff), { hidden: hideAmounts })}{" "}
          {paceDiff > 0 ? "above" : "below"}{" "}
          <span className="text-muted-foreground">your {priorMonthCount}-month pace</span>
        </span>
      </p>
    );
  };

  return (
    <>
      <Separator />
      {renderPaceMessage()}
      <div
        data-testid="pace-history"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-xs"
      >
        {prior.map((month, index) => (
          <span key={month.label} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground/50">·</span>}
            <span className="text-muted-foreground">{month.label.split(" ")[0].slice(0, 3)}</span>
            {month.transactionCount > 0 ? (
              <span className="text-foreground">
                {formatAmount(month.expenses, { hidden: hideAmounts })}
              </span>
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
    hideSummaryCardAmounts,
  } = Route.useLoaderData();
  const persistHideAmounts = useServerFn(setHideSummaryCardAmountsFn);
  const [persistedHideAmounts, setPersistedHideAmounts] = useState(hideSummaryCardAmounts);
  const [hideAmounts, setOptimisticHideAmounts] = useOptimistic(persistedHideAmounts);
  const [isPending, startTransition] = useTransition();
  const isEmpty = current.transactionCount === 0;

  const toggleAmounts = () => {
    const nextHideAmounts = !hideAmounts;

    startTransition(async () => {
      setOptimisticHideAmounts(nextHideAmounts);

      try {
        await persistHideAmounts({ data: nextHideAmounts });
        setPersistedHideAmounts(nextHideAmounts);
      } catch {
        // Keep the last persisted value; the optimistic update reverts when the transition ends.
      }
    });
  };

  return (
    <Card data-testid="summary-net-card" size="sm" className="min-w-0 flex-1">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-muted-foreground">
            Your <span className="text-foreground">{current.label}</span> finances so far
          </CardTitle>
          <AmountsVisibilityToggle
            hideAmounts={hideAmounts}
            onToggle={toggleAmounts}
            isPending={isPending}
          />
        </div>
        {isEmpty ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No transactions this month.</EmptyTitle>
              <EmptyDescription>Add one to see your summary.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <NetHeadline hideAmounts={hideAmounts} />
            <ExpenseBreakdown hideAmounts={hideAmounts} />
            <PaceComparison hideAmounts={hideAmounts} />
          </>
        )}
      </CardContent>
    </Card>
  );
};
