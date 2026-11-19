import { createFileRoute } from "@tanstack/react-router";
import { formatInTimeZone } from "date-fns-tz";

import { getFinanceDashboardFn } from "@/app/finance/analytics/analytics.functions";
import { getFinancePreferencesFn } from "@/app/finance/preferences/preferences.functions";
import {
  getScheduledExpensesForCurrentMonthFn,
  getUpcomingScheduledTransactionTemplatesFn,
} from "@/app/finance/scheduled/scheduled.functions";
import { getRecentTransactionsFn } from "@/app/finance/transactions/transactions.functions";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { TIME_ZONE } from "@/lib/date-only";

import { FinanceContainer } from "../-common/components/finance-container";
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
    <FinanceContainer.Root
      header={<AppHeader current="Finances" backTo="/" />}
      footer={<FinanceContainer.Footer />}
    >
      <div className="container mx-auto flex flex-1 flex-col gap-4 p-4 lg:px-0">
        <h1 className="sr-only">Finances</h1>
        <h2 className="sr-only">{monthLabel}</h2>
        <Card
          variant="flat"
          className="flex flex-col gap-4 border-0 bg-transparent lg:h-96 lg:flex-row lg:gap-px lg:border lg:bg-border"
        >
          <SummaryNetCard />
          <RecentTransactionsCard />
          <UpcomingTransactionsCard />
        </Card>
        <Card
          variant="flat"
          className="flex flex-col gap-4 border-0 bg-transparent lg:flex-row lg:gap-px lg:border lg:bg-border"
        >
          <MonthlyNetCard />
          <CategoryTrendsCard />
        </Card>
      </div>
    </FinanceContainer.Root>
  );
}
