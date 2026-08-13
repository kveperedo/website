import { useServerFn } from "@tanstack/react-start";
import { debounce } from "es-toolkit/function";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { setCategoryTrendsVisibleCategoriesFn } from "@/app/finance/preferences/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

function TrendsLegend({ visibleCategories }: { visibleCategories: Array<TransactionCategory> }) {
  return (
    <div data-testid="category-trends-legend" className="flex flex-wrap justify-center pt-3">
      {CATEGORIES.filter((category) => visibleCategories.includes(category.value)).map(
        (category) => (
          <div key={category.value} className="flex items-center gap-1.5 p-2 sm:px-4">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-none"
              style={{ backgroundColor: CATEGORY_CHART_COLORS[category.value] }}
            />
            <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[category.value]}</span>
          </div>
        ),
      )}
    </div>
  );
}

function CategoryFilter({
  visibleCategories,
  onSelectionChange,
}: {
  visibleCategories: Array<TransactionCategory>;
  onSelectionChange: (categories: Array<TransactionCategory>) => void;
}) {
  const selectedKeys = useMemo(() => new Set(visibleCategories), [visibleCategories]);
  const areAllCategoriesVisible = visibleCategories.length === CATEGORIES.length;
  const areNoCategoriesVisible = visibleCategories.length === 0;
  return (
    <DropdownMenuTrigger>
      <Button variant="outline" size="sm" className="gap-1.5">
        <span>Filter</span>
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu className="w-40" placement="bottom end">
        <DropdownMenuGroup aria-label="Bulk actions">
          <DropdownMenuItem
            isDisabled={areAllCategoriesVisible}
            shouldCloseOnSelect={false}
            onAction={() => {
              onSelectionChange(CATEGORIES.map((category) => category.value));
            }}
          >
            Select all
          </DropdownMenuItem>
          <DropdownMenuItem
            isDisabled={areNoCategoriesVisible}
            shouldCloseOnSelect={false}
            onAction={() => {
              onSelectionChange([]);
            }}
          >
            Deselect all
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            if (keys === "all") {
              onSelectionChange(CATEGORIES.map((category) => category.value));
              return;
            }
            onSelectionChange(
              CATEGORIES.filter((category) => keys.has(category.value)).map(
                (category) => category.value,
              ),
            );
          }}
        >
          <DropdownMenuLabel className="px-2 py-1">Filter categories</DropdownMenuLabel>
          {CATEGORIES.map((category) => (
            <DropdownMenuItem
              id={category.value}
              key={category.value}
              textValue={CATEGORY_LABELS[category.value]}
            >
              <span
                className="mr-2 inline-block h-2 w-2 shrink-0 rounded-none"
                style={{ backgroundColor: CATEGORY_CHART_COLORS[category.value] }}
              />
              {CATEGORY_LABELS[category.value]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}

export const CategoryTrendsCard = () => {
  const { categoryTrends, categoryTrendsVisibleCategories } = Route.useLoaderData();
  const setCategoryTrendsVisibleCategories = useServerFn(setCategoryTrendsVisibleCategoriesFn);
  const [visibleCategories, setVisibleCategories] = useState<Array<TransactionCategory>>(
    () => categoryTrendsVisibleCategories ?? CATEGORIES.map((category) => category.value),
  );
  const isEmpty = categoryTrends.length === 0;

  const chartData = isEmpty ? [] : categoryTrends;
  const persistSelection = useEffectEvent((categories: Array<TransactionCategory>) => {
    void setCategoryTrendsVisibleCategories({ data: categories });
  });
  const debouncedPersistSelection = useRef(
    debounce((categories: Array<TransactionCategory>) => persistSelection(categories), 300),
  ).current;

  useEffect(() => () => debouncedPersistSelection.flush(), [debouncedPersistSelection]);

  const handleSelectionChange = (categories: Array<TransactionCategory>) => {
    setVisibleCategories(categories);
    debouncedPersistSelection(categories);
  };

  return (
    <Card data-testid="category-trends-card" className={cn("flex-1 gap-0 py-0", isEmpty && "pt-6")}>
      {!isEmpty && (
        <CardHeader className="flex items-center justify-between px-4 py-4">
          <CardTitle className="font-mono text-xs text-muted-foreground">Category trends</CardTitle>
          <CategoryFilter
            visibleCategories={visibleCategories}
            onSelectionChange={handleSelectionChange}
          />
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
        ) : visibleCategories.length === 0 ? (
          <div className="px-6 py-12 md:px-8">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No categories selected.</EmptyTitle>
                <EmptyDescription>
                  Select a category from Filter to show its trend.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                size="sm"
                onPress={() => handleSelectionChange(CATEGORIES.map((category) => category.value))}
              >
                Select all categories
              </Button>
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
                  const isVisible = visibleCategories.includes(category.value);
                  return isVisible ? (
                    <Line
                      key={category.value}
                      type="monotone"
                      dataKey={category.value}
                      stroke={CATEGORY_CHART_COLORS[category.value]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ) : null;
                })}
              </LineChart>
            </ChartContainer>
            <TrendsLegend visibleCategories={visibleCategories} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
