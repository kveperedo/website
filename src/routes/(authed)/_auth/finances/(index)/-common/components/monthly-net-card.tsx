import { useId } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import { formatMonthLabel, SHORT_MONTHS } from "../months";

const NET_CHART_CONFIG = {
  net: { label: "Net" },
};

const formatCurrency = (value: number, includeSign = false) => {
  const sign = includeSign && value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}₱${Math.abs(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
};

export const MonthlyNetCard = () => {
  const { monthlyNet } = Route.useLoaderData();
  const descriptionId = useId();
  const isEmpty = monthlyNet.length === 0;

  return (
    <Card data-testid="monthly-net-card" className={cn("flex-1 gap-0 py-0", isEmpty && "pt-6")}>
      {!isEmpty && (
        <CardHeader className="px-4 py-4">
          <CardTitle className="text-muted-foreground">Monthly net</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex flex-col p-0 sm:min-h-0 sm:flex-1">
        {isEmpty ? (
          <div className="px-6 pt-2 pb-6 md:px-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No monthly data yet.</EmptyTitle>
                <EmptyDescription>Add a transaction to track your monthly net.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <>
            <p id={descriptionId} className="sr-only">
              Use the arrow keys to review each month&apos;s net, income, and expenses.
            </p>
            <ChartContainer
              data-testid="monthly-net-chart"
              config={NET_CHART_CONFIG}
              className="aspect-auto h-60 w-full px-4 pb-4 sm:h-auto sm:min-h-0 sm:flex-1"
              initialDimension={{ width: 320, height: 350 }}
            >
              <BarChart
                data={monthlyNet}
                aria-label="Monthly net by month"
                aria-describedby={descriptionId}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => SHORT_MONTHS[Number(String(value).split("-")[1]) - 1]}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={54}
                  domain={[(min) => Math.min(min, 0), (max) => Math.max(max, 0)]}
                  tickFormatter={(value) => {
                    const prefix = value > 0 ? "+" : "";
                    return `${prefix}${value >= 1000 || value <= -1000 ? `${(value / 1000).toFixed(0)}K` : value}`;
                  }}
                />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label, payload) => {
                        const isCurrentMonth = Boolean(payload[0]?.payload?.isCurrentMonth);
                        return `${formatMonthLabel(String(label))}${isCurrentMonth ? " (month-to-date)" : ""}`;
                      }}
                      formatter={(value, _name, _item, _index, payload) => {
                        const data = payload as unknown as { income: number; expenses: number };
                        return (
                          <div className="grid w-full gap-1.5 font-mono">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Net</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(Number(value), true)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Income</span>
                              <span className="font-medium text-emerald-400">
                                {formatCurrency(data.income)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Expenses</span>
                              <span className="font-medium text-destructive">
                                {formatCurrency(data.expenses)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="net" radius={0} maxBarSize={48}>
                  {monthlyNet.map((month) => (
                    <Cell
                      key={month.month}
                      data-testid={`monthly-net-bar-${month.month}`}
                      fill={
                        month.net > 0
                          ? "var(--color-emerald-400)"
                          : month.net < 0
                            ? "var(--destructive)"
                            : "var(--muted-foreground)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
