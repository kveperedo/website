import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import type { ChartConfig } from "#/components/ui/chart";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "#/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "#/components/ui/empty";
import { cn } from "#/lib/utils";

import { Route } from "../..";
import { CATEGORY_CHART_COLORS, CATEGORY_LABELS } from "../../../-common/constants";

const chartConfig = {
  food_drinks: { label: CATEGORY_LABELS.food_drinks, color: CATEGORY_CHART_COLORS.food_drinks },
  groceries_household: {
    label: CATEGORY_LABELS.groceries_household,
    color: CATEGORY_CHART_COLORS.groceries_household,
  },
  transportation: {
    label: CATEGORY_LABELS.transportation,
    color: CATEGORY_CHART_COLORS.transportation,
  },
  bills_utilities: {
    label: CATEGORY_LABELS.bills_utilities,
    color: CATEGORY_CHART_COLORS.bills_utilities,
  },
  health_wellness: {
    label: CATEGORY_LABELS.health_wellness,
    color: CATEGORY_CHART_COLORS.health_wellness,
  },
  hobbies_lifestyle: {
    label: CATEGORY_LABELS.hobbies_lifestyle,
    color: CATEGORY_CHART_COLORS.hobbies_lifestyle,
  },
  financial: { label: CATEGORY_LABELS.financial, color: CATEGORY_CHART_COLORS.financial },
} satisfies ChartConfig;

const BAR_HEIGHT = 36;

export const CategorySummaryCard = () => {
  const { categorySummary } = Route.useLoaderData();
  const isEmpty = categorySummary.length === 0;

  const chartData = categorySummary.map((item) => ({
    category: CATEGORY_LABELS[item.category],
    total: item.total,
    fill: CATEGORY_CHART_COLORS[item.category],
  }));

  const chartHeight = Math.max(chartData.length * BAR_HEIGHT, 80);

  return (
    <Card className={cn("gap-0 py-0", isEmpty && "pt-6")}>
      {!isEmpty && (
        <CardHeader className="px-4 py-4">
          <CardTitle className="font-mono text-sm text-foreground">Spending by category</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {isEmpty ? (
          <div className="px-6 pt-2 pb-6 md:px-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No expenses recorded this month.</EmptyTitle>
                <EmptyDescription>
                  Add a transaction to see your spending breakdown.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full px-4 pb-4"
            style={{ minHeight: chartHeight }}
            initialDimension={{ width: 320, height: chartHeight }}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <YAxis
                type="category"
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={90}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}K` : String(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [
                      `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                    ]}
                    indicator="dot"
                  />
                }
              />
              <Bar dataKey="total" radius={0} maxBarSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
