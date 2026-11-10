import { createFileRoute } from "@tanstack/react-router";
import { formatInTimeZone } from "date-fns-tz";

import { getFinanceDashboardFn } from "@/app/finance/analytics/analytics.functions";
import { getFinancePreferencesFn } from "@/app/finance/preferences/preferences.functions";
import {
  getScheduledExpensesForCurrentMonthFn,
  getUpcomingScheduledTransactionTemplatesFn,
} from "@/app/finance/scheduled/scheduled.functions";
import { getRecentTransactionsFn } from "@/app/finance/transactions/transactions.functions";
import { TIME_ZONE } from "@/lib/date-only";

import { FinanceContainer } from "../-common/components/finance-container";
import { CategorySummaryCard } from "./-common/components/category-summary-card";
import { CategoryTrendsCard } from "./-common/components/category-trends-card";
import { MonthlyNetCard } from "./-common/components/monthly-net-card";
import { RecentTransactionsCard } from "./-common/components/recent-transactions-card";
import { SummaryNetCard } from "./-common/components/summary-net-card";
import { UpcomingTransactionsCard } from "./-common/components/upcoming-transactions-card";

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Finances | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(authed)/_auth/finances/(index)/")({
  head: () => ({ meta: META }),
  loader: async () => {
    const [
      financeDashboard,
      transactions,
      upcomingTransactions,
      financePreferences,
      scheduledProjection,
    ] = await Promise.all([
      getFinanceDashboardFn(),
      getRecentTransactionsFn(),
      getUpcomingScheduledTransactionTemplatesFn(),
      getFinancePreferencesFn(),
      getScheduledExpensesForCurrentMonthFn(),
    ]);
    const monthLabel = formatInTimeZone(new Date(), TIME_ZONE, "MMMM yyyy");
    return {
      transactions,
      financeDashboard,
      upcomingTransactions,
      categoryTrendsVisibleCategories: financePreferences.categoryTrendsVisibleCategories,
      scheduledProjection,
      hideSummaryCardAmounts: financePreferences.hideSummaryCardAmounts,
      monthLabel,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { monthLabel } = Route.useLoaderData();

  return (
    <FinanceContainer.Root footer={<FinanceContainer.Footer />}>
      <div className="container mx-auto flex flex-1 flex-col gap-4 p-4">
        <h2 className="sr-only">{monthLabel}</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <SummaryNetCard />
          <UpcomingTransactionsCard />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <RecentTransactionsCard />
          <CategorySummaryCard />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <MonthlyNetCard />
          <CategoryTrendsCard />
        </div>
      </div>
    </FinanceContainer.Root>
  );
}
