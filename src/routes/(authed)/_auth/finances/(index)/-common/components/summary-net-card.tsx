import { useServerFn } from "@tanstack/react-start";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { setHideSummaryCardAmountsFn } from "@/app/finance/preferences/preferences.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import {
  CATEGORY_CHART_COLORS,
  CATEGORY_LABELS,
  TRANSACTION_TYPE_COLORS,
} from "../../../-common/constants";
import { getExpenseProgress } from "../expense-progress";
import { formatAmount } from "../format-amount";
import { AmountsVisibilityToggle } from "./amounts-visibility";

type AmountVisibilityProps = { hideAmounts: boolean };

function NetHeadline({ hideAmounts }: AmountVisibilityProps) {
  const {
    financeDashboard: {
      history: { current },
    },
  } = Route.useLoaderData();
  const isNetPositive = current.net >= 0;
  const netLabel = isNetPositive ? "left" : "over income";
  const netColor = isNetPositive ? TRANSACTION_TYPE_COLORS.income : TRANSACTION_TYPE_COLORS.expense;

  return (
    <p data-testid="net-headline" className={cn("text-lg sm:text-xl", netColor)}>
      <span className="font-mono">
        {formatAmount(Math.abs(current.net), { hidden: hideAmounts })}
      </span>{" "}
      {netLabel}
    </p>
  );
}

function hasScheduledProjection(projection: { scheduledCount: number; scheduledExpenses: number }) {
  return projection.scheduledCount > 0 && projection.scheduledExpenses > 0;
}

function ExpenseProgress() {
  const {
    financeDashboard: {
      history: { current },
    },
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
    financeDashboard: {
      history: { current },
    },
    scheduledProjection,
  } = Route.useLoaderData();
  const hasIncome = current.income > 0;

  if (!hasIncome) {
    return (
      <div className="flex flex-col gap-2 text-xs">
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
    <div className="flex flex-col gap-2 text-xs">
      <p className="text-muted-foreground">
        Expenses are <span className="font-mono text-foreground">{expensesPercent}%</span> of income
      </p>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <ExpenseProgress />
        <span
          data-testid="expense-breakdown-label"
          className="font-mono text-xxs whitespace-nowrap text-muted-foreground"
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
    financeDashboard: {
      history: { prior, averagePriorExpenses, priorMonthCount, current },
    },
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
          <span className="font-mono">
            {formatAmount(Math.abs(paceDiff), { hidden: hideAmounts })}
          </span>{" "}
          {paceDiff > 0 ? "above" : "below"}{" "}
          <span className="text-muted-foreground">your {priorMonthCount}-month pace</span>
        </span>
      </p>
    );
  };

  return (
    <>
      <div className="-mx-3">
        <Separator />
      </div>
      {renderPaceMessage()}
      <div
        data-testid="pace-history"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs"
      >
        {prior.map((month, index) => (
          <span key={month.label} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground/50">·</span>}
            <span className="text-muted-foreground">{month.label.split(" ")[0].slice(0, 3)}</span>
            {month.transactionCount > 0 ? (
              <span className="font-mono text-foreground">
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

function SpendingBreakdown({ hideAmounts }: AmountVisibilityProps) {
  const {
    financeDashboard: { categorySummary },
  } = Route.useLoaderData();

  if (categorySummary.length === 0) {
    return (
      <>
        <div className="-mx-3">
          <Separator />
        </div>
        <div data-testid="category-summary-card">
          <p className="text-xs text-muted-foreground">No expenses recorded this month.</p>
        </div>
      </>
    );
  }

  const total = categorySummary.reduce((sum, item) => sum + item.total, 0);
  const items = categorySummary.map((item) => ({
    label: CATEGORY_LABELS[item.category],
    color: CATEGORY_CHART_COLORS[item.category],
    amount: formatAmount(item.total, { hidden: hideAmounts, compact: true }),
    percent: total > 0 ? (item.total / total) * 100 : 0,
  }));

  return (
    <>
      <div className="-mx-3">
        <Separator />
      </div>
      <div data-testid="category-summary-card" className="flex flex-col gap-2">
        <h3 className="sr-only">Spending breakdown</h3>
        <div
          role="img"
          aria-label="Spending by category"
          className="flex h-2.5 w-full overflow-hidden bg-muted"
        >
          {items.map((item) => (
            <div
              key={item.label}
              style={{ width: `${item.percent}%`, backgroundColor: item.color }}
              title={`${item.label}: ${item.amount}`}
            />
          ))}
        </div>
        <ul className="grid grid-cols-1 gap-x-3 gap-y-1 lg:grid-cols-2">
          {items.map((item) => (
            <li key={item.label} className="flex min-w-0 items-center gap-1.5 text-xxs">
              <span
                aria-hidden
                className="size-1.5 shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 truncate text-muted-foreground">{item.label}</span>
              <span className="ml-auto shrink-0 font-mono text-muted-foreground">
                {item.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export const SummaryNetCard = () => {
  const {
    financeDashboard: {
      history: { current },
    },
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
    <Card
      data-testid="summary-net-card"
      size="sm"
      variant="flat"
      className="min-w-0 flex-1 lg:min-h-0 lg:border-0"
    >
      <CardHeader variant="flat" className="justify-between gap-2">
        <CardTitle variant="flat">
          Your <span className="text-foreground">{current.label}</span> finances so far
        </CardTitle>
        <AmountsVisibilityToggle
          hideAmounts={hideAmounts}
          onToggle={toggleAmounts}
          isPending={isPending}
        />
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-2 p-3 lg:overflow-y-auto">
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
        <SpendingBreakdown hideAmounts={hideAmounts} />
      </CardContent>
    </Card>
  );
};
