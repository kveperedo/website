import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import {
  CATEGORY_CHART_CONFIG,
  CATEGORY_CHART_COLORS,
  CATEGORY_LABELS,
} from "../../../-common/constants";

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
    <Card className={cn("gap-0 py-0 sm:flex-2", isEmpty && "pt-6")}>
      {!isEmpty && (
        <CardHeader className="px-4 py-4">
          <CardTitle className="text-muted-foreground">Spending breakdown</CardTitle>
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
            config={CATEGORY_CHART_CONFIG}
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
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
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
