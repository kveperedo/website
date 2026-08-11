import { useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { Route } from "../..";
import {
  CATEGORY_CHART_CONFIG,
  CATEGORIES,
  CATEGORY_CHART_COLORS,
  CATEGORY_LABELS,
} from "../../../-common/constants";

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMonthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  return `${FULL_MONTHS[month - 1]} ${year}`;
}

const CHART_HEIGHT = 350;

function TrendsLegend({
  hoveredCategory,
  pressedCategory,
  onHover,
  onPress,
}: {
  hoveredCategory: TransactionCategory | null;
  pressedCategory: TransactionCategory | null;
  onHover: (category: TransactionCategory | null) => void;
  onPress: (category: TransactionCategory | null) => void;
}) {
  const hasRecentlyPressed = useRef(false);

  return (
    <div className="flex flex-wrap justify-center pt-3">
      {CATEGORIES.map((category) => {
        const isActive =
          pressedCategory === category.value ||
          (!pressedCategory && hoveredCategory === category.value);
        const isDimmed = (hoveredCategory !== null || pressedCategory !== null) && !isActive;
        return (
          <Button
            key={category.value}
            variant="ghost"
            size="xs"
            onPress={() => {
              hasRecentlyPressed.current = true;
              onPress(pressedCategory === category.value ? null : category.value);
              setTimeout(() => {
                hasRecentlyPressed.current = false;
              }, 100);
            }}
            onHoverStart={() => onHover(category.value)}
            onHoverEnd={() => {
              if (!hasRecentlyPressed.current) {
                onHover(null);
              }
            }}
            className={cn(
              "gap-1.5 px-2 py-3 transition-opacity active:translate-y-0! sm:px-4",
              isDimmed && "opacity-30",
            )}
          >
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-none"
              style={{ backgroundColor: CATEGORY_CHART_COLORS[category.value] }}
            />
            <span
              className={cn(
                "text-xs",
                isDimmed ? "text-muted-foreground/40" : "text-muted-foreground",
              )}
            >
              {CATEGORY_LABELS[category.value]}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export const CategoryTrendsCard = () => {
  const { categoryTrends } = Route.useLoaderData();
  const [hoveredCategory, setHoveredCategory] = useState<TransactionCategory | null>(null);
  const [pressedCategory, setPressedCategory] = useState<TransactionCategory | null>(null);
  const isEmpty = categoryTrends.length === 0;

  const chartData = isEmpty ? [] : categoryTrends;

  return (
    <Card className={cn("flex-1 gap-0 py-0", isEmpty && "pt-6")}>
      {!isEmpty && (
        <CardHeader className="px-4 py-4">
          <CardTitle className="font-mono text-xs text-muted-foreground">Category trends</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {isEmpty ? (
          <div className="px-6 pt-2 pb-6 md:px-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Not enough data for trends.</EmptyTitle>
                <EmptyDescription>
                  Add transactions across multiple months to see spending trends.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <ChartContainer
              config={CATEGORY_CHART_CONFIG}
              className="w-full"
              initialDimension={{ width: 320, height: CHART_HEIGHT }}
            >
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    const month = Number(String(value).split("-")[1]);
                    return SHORT_MONTHS[month - 1];
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}K` : String(value)
                  }
                  tick={{ fontSize: 11 }}
                  width={48}
                />
                <ChartTooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => formatMonthLabel(String(label))}
                      formatter={(value, name) => {
                        const config =
                          CATEGORY_CHART_CONFIG[name as keyof typeof CATEGORY_CHART_CONFIG];
                        return [
                          <span key="value" className="flex items-center gap-1.5 font-mono">
                            {config?.color && (
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-xs"
                                style={{ backgroundColor: config.color }}
                              />
                            )}
                            <span className="text-muted-foreground">
                              {config?.label ?? String(name)}
                            </span>
                            <span className="ml-auto font-medium text-foreground">
                              ₱{Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </span>
                          </span>,
                        ];
                      }}
                    />
                  }
                />
                {CATEGORIES.map((category) => {
                  const isActive =
                    pressedCategory === category.value ||
                    (!pressedCategory && hoveredCategory === category.value);
                  const isDimmed =
                    (hoveredCategory !== null || pressedCategory !== null) && !isActive;
                  return (
                    <Line
                      key={category.value}
                      type="monotone"
                      dataKey={category.value}
                      stroke={CATEGORY_CHART_COLORS[category.value]}
                      strokeWidth={2}
                      strokeOpacity={isDimmed ? 0.15 : 1}
                      dot={false}
                      activeDot={
                        hoveredCategory !== null || pressedCategory !== null ? false : { r: 4 }
                      }
                    />
                  );
                })}
              </LineChart>
            </ChartContainer>
            <TrendsLegend
              hoveredCategory={hoveredCategory}
              pressedCategory={pressedCategory}
              onHover={setHoveredCategory}
              onPress={setPressedCategory}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
