import { createFileRoute, useRouter } from "@tanstack/react-router";
import { addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, SearchIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";

import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

import { formatLocal, getCurrentYearMonth } from "@/app/finance/local-date";
import { getTransactionsByMonthFn } from "@/app/finance/transactions/functions";
import { Button, TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TransactionCategorySchema } from "@/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "@/generated/zod/schemas/enums/TransactionType.schema";
import { CategoryFilter } from "@/routes/(authed)/_auth/finances/-common/components/category-filter";
import { TransactionTable } from "@/routes/(authed)/_auth/finances/-common/components/transaction-table";

import { FinanceContainer } from "../../-common/components/finance-container";

const searchSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  q: z.string().optional(),
  type: TransactionTypeSchema.optional(),
  categories: z.array(TransactionCategorySchema).optional(),
});

const SEARCH_DEBOUNCE_MS = 250;

export const Route = createFileRoute("/(authed)/_auth/finances/transactions/(index)/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { year, month, q, type, categories } }) => ({
    year,
    month,
    q,
    type,
    categories,
  }),
  loader: async ({ deps }) => {
    const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
    const year = deps.year ?? currentYear;
    const month = deps.month ?? currentMonth;
    const transactions = await getTransactionsByMonthFn({
      data: {
        year,
        month,
        q: deps.q || undefined,
        type: deps.type,
        categories: deps.type === "income" ? undefined : deps.categories,
      },
    });
    const monthLabel = formatLocal(new Date(year, month - 1, 15), "MMMM yyyy");
    return { transactions, monthLabel, year, month };
  },
  head: ({ loaderData }) => {
    const { year, month } = loaderData!;

    const monthLabel = formatLocal(new Date(year, month - 1, 15), "MMMM yyyy");
    return { meta: [{ title: `${monthLabel} Transactions | Kevin Von Erich Peredo` }] };
  },
  component: RouteComponent,
});

function MonthNavigation() {
  const { year, month } = Route.useLoaderData();
  const search = Route.useSearch();
  const current = new Date(year, month - 1);
  const previousDate = subMonths(current, 1);
  const nextDate = addMonths(current, 1);
  const transactionSearch = {
    year,
    month,
    q: search.q || undefined,
    type: search.type,
    categories: search.categories?.length ? search.categories : undefined,
  };

  return (
    <>
      <TanstackLinkButton
        to="/finances/transactions"
        search={{
          ...transactionSearch,
          year: previousDate.getFullYear(),
          month: previousDate.getMonth() + 1,
        }}
        variant="secondary"
        size="icon"
        aria-label={`Previous month, ${formatLocal(previousDate, "MMMM yyyy")}`}
      >
        <ChevronLeft />
      </TanstackLinkButton>
      <TanstackLinkButton
        to="/finances/transactions"
        search={{
          ...transactionSearch,
          year: nextDate.getFullYear(),
          month: nextDate.getMonth() + 1,
        }}
        variant="secondary"
        size="icon"
        aria-label={`Next month, ${formatLocal(nextDate, "MMMM yyyy")}`}
      >
        <ChevronRight />
      </TanstackLinkButton>
    </>
  );
}

function TransactionHeader() {
  const { monthLabel, year, month } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const [inputValue, setInputValue] = useState(search.q ?? "");
  const [isOpen, setIsOpen] = useState(Boolean(search.q));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const submittedQueryRef = useRef(search.q);

  const debouncedNavigate = useDebouncedCallback((q?: string) => {
    submittedQueryRef.current = q;
    router.navigate({
      to: "/finances/transactions",
      search: (current) => ({
        ...current,
        year: current.year ?? year,
        month: current.month ?? month,
        q,
      }),
      replace: true,
    });
  }, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (search.q !== submittedQueryRef.current) {
      submittedQueryRef.current = search.q;
      setInputValue(search.q ?? "");
      setIsOpen(Boolean(search.q));
    }
  }, [search.q]);

  useEffect(() => () => debouncedNavigate.cancel(), [debouncedNavigate]);

  const focusButton = () => requestAnimationFrame(() => buttonRef.current?.focus());

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-medium text-foreground">Transactions</h2>
          <p className="text-xs text-muted-foreground">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {!isOpen && (
            <Button
              ref={buttonRef}
              variant="ghost"
              size="icon"
              className="mr-2"
              onPress={() => {
                setIsOpen(true);
              }}
              aria-label="Search transactions"
            >
              <SearchIcon />
            </Button>
          )}
          <MonthNavigation />
        </div>
      </div>
      {isOpen && (
        <div
          className="relative"
          onBlur={(event) => {
            if (!inputValue && !event.currentTarget.contains(event.relatedTarget)) {
              setIsOpen(false);
            }
          }}
        >
          <Input
            autoFocus
            id="transaction-search"
            className="pr-12"
            value={inputValue}
            onChange={(event) => {
              const q = event.target.value;
              setInputValue(q);
              debouncedNavigate(q.trim() || undefined);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                debouncedNavigate.flush();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                debouncedNavigate.cancel();
                setInputValue(search.q ?? "");
                if (!search.q) {
                  setIsOpen(false);
                  focusButton();
                }
              }
            }}
            placeholder={`Search ${monthLabel} transactions`}
            aria-label={`Search ${monthLabel} transactions`}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onPress={() => {
              setInputValue("");
              setIsOpen(false);
              debouncedNavigate.cancel();
              submittedQueryRef.current = undefined;
              router.navigate({
                to: "/finances/transactions",
                search: (current) => ({
                  ...current,
                  year: current.year ?? year,
                  month: current.month ?? month,
                  q: undefined,
                }),
                replace: true,
              });
              focusButton();
            }}
            className="absolute inset-y-0 right-1 my-auto text-muted-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </>
  );
}

function TransactionFilters() {
  const { year, month } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const selectedCategories = search.categories ?? [];

  const navigate = (
    next: {
      type?: TransactionType;
      categories?: Array<TransactionCategory>;
    } = {},
  ) => {
    router.navigate({
      to: "/finances/transactions",
      search: (current) => {
        const type = "type" in next ? next.type : current.type;
        const categories = ("categories" in next ? next.categories : current.categories) ?? [];

        return {
          ...current,
          year: current.year ?? year,
          month: current.month ?? month,
          type,
          categories: categories.length ? categories : undefined,
        };
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        selectionMode="single"
        selectedKeys={[search.type ?? "all"]}
        onSelectionChange={(keys) => {
          const type = ([...keys][0] as TransactionType | "all") ?? "all";
          navigate({
            type: type === "all" ? undefined : type,
            categories: type === "income" ? [] : selectedCategories,
          });
        }}
        variant="outline"
        size="sm"
        spacing={0}
        aria-label="Transaction type"
      >
        <ToggleGroupItem id="all">All</ToggleGroupItem>
        <ToggleGroupItem id="expense">Expenses</ToggleGroupItem>
        <ToggleGroupItem id="income">Income</ToggleGroupItem>
      </ToggleGroup>
      {search.type !== "income" && (
        <div className="ml-auto">
          <CategoryFilter
            selectedCategories={selectedCategories}
            onSelectionChange={(categories) => navigate({ categories })}
            showSelectAll={false}
          />
        </div>
      )}
    </div>
  );
}

function RouteComponent() {
  const { transactions, monthLabel, year, month } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const selectedCategories = search.categories ?? [];

  const handleClearFilters = () => {
    router.navigate({
      to: "/finances/transactions",
      search: { year, month, q: undefined, type: undefined, categories: undefined },
    });
  };

  const transactionSearch = {
    year,
    month,
    q: search.q || undefined,
    type: search.type,
    categories: selectedCategories.length ? selectedCategories : undefined,
  };
  const hasNoTransactions = transactions.length === 0;
  const hasActiveFilters = Boolean(search.q || search.type || selectedCategories.length);
  const hasNoResults = hasNoTransactions && hasActiveFilters;

  return (
    <FinanceContainer.Root
      header={
        <div className="flex flex-col gap-3">
          <TransactionHeader />
          <TransactionFilters />
        </div>
      }
      footer={<FinanceContainer.Footer />}
    >
      <div className="container mx-auto flex flex-1 flex-col gap-4 px-4 py-4 sm:px-0">
        {hasNoResults ? (
          <Card className="py-6">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No transactions match your filters.</EmptyTitle>
                <EmptyDescription>Try a different search term or filter.</EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" size="sm" onPress={handleClearFilters}>
                Clear filters
              </Button>
            </Empty>
          </Card>
        ) : hasNoTransactions ? (
          <Card className="py-6">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No transactions in {monthLabel}.</EmptyTitle>
                <EmptyDescription>Try a different month or add a transaction.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <Card className="gap-0 py-0">
            <CardContent className="p-0">
              <TransactionTable
                transactions={transactions}
                label={`Transactions for ${monthLabel}`}
                transactionSearch={transactionSearch}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </FinanceContainer.Root>
  );
}
