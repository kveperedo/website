import { createFileRoute, useRouter } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

import { getMonthlySummaryByMonthFn } from "@/app/finance/analytics/analytics.functions";
import { getCurrentYearMonth } from "@/app/finance/shared/local-date";
import { getTransactionsByMonthFn } from "@/app/finance/transactions/transactions.functions";
import { AppHeader } from "@/components/app-header";
import { BreadcrumbItem, BreadcrumbPage, TanstackBreadcrumbLink } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { TransactionCategorySchema } from "@/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "@/generated/zod/schemas/enums/TransactionType.schema";
import { formatLocal } from "@/lib/date-only";
import { useBreakpoint } from "@/lib/use-media-query";
import { CategoryToggles } from "@/routes/(authed)/_auth/finances/-common/components/category-toggles";
import { SummaryCard } from "@/routes/(authed)/_auth/finances/-common/components/summary-card";
import { TransactionList } from "@/routes/(authed)/_auth/finances/-common/components/transaction-list";

import { FinanceContainer } from "../../-common/components/finance-container";
import { MonthNavigation } from "./-common/components/month-navigation";
import { TransactionFilters } from "./-common/components/transaction-filters";
import { TransactionSearch } from "./-common/components/transaction-search";
import { useTransactionFilterNavigation } from "./-common/use-transaction-filter-navigation";

const searchSchema = z.object({
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    q: z.string().optional(),
    type: TransactionTypeSchema.optional(),
    categories: z.array(TransactionCategorySchema).optional(),
});

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
        const monthQuery = {
            year,
            month,
            q: deps.q || undefined,
            type: deps.type,
            categories: deps.type === "income" ? undefined : deps.categories,
        };
        const [transactions, summary] = await Promise.all([
            getTransactionsByMonthFn({ data: monthQuery }),
            getMonthlySummaryByMonthFn({ data: monthQuery }),
        ]);
        const monthLabel = formatLocal(new Date(year, month - 1, 15), "MMMM yyyy");
        return { transactions, summary, monthLabel, year, month };
    },
    head: ({ loaderData }) => {
        const { year, month } = loaderData!;

        const monthLabel = formatLocal(new Date(year, month - 1, 15), "MMMM yyyy");
        return { meta: [{ title: `${monthLabel} Transactions | Kevin Von Erich Peredo` }] };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const isMobile = !useBreakpoint("sm");
    const { transactions, summary, monthLabel, year, month } = Route.useLoaderData();
    const search = Route.useSearch();
    const router = useRouter();
    const selectedCategories = search.categories ?? [];
    const navigateTransactionFilters = useTransactionFilterNavigation();
    const [isSearchOpen, setIsSearchOpen] = useState(Boolean(search.q));
    const searchButtonRef = useRef<HTMLButtonElement>(null);

    const closeSearch = () => {
        setIsSearchOpen(false);
        requestAnimationFrame(() => searchButtonRef.current?.focus());
    };

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

    const renderTransactionsContent = () => {
        if (hasNoResults) {
            return (
                <div className="py-8">
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>No transactions match your filters.</EmptyTitle>
                            <EmptyDescription>
                                Try a different search term or filter.
                            </EmptyDescription>
                        </EmptyHeader>
                        <Button variant="outline" size="sm" onPress={handleClearFilters}>
                            Clear filters
                        </Button>
                    </Empty>
                </div>
            );
        }
        if (hasNoTransactions) {
            return (
                <div className="py-8">
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>No transactions in {monthLabel}.</EmptyTitle>
                            <EmptyDescription>
                                Try a different month or add a transaction.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                </div>
            );
        }
        return (
            <TransactionList
                transactions={transactions}
                label={`Transactions for ${monthLabel}`}
                transactionSearch={transactionSearch}
            />
        );
    };

    return (
        <FinanceContainer.Root
            classNames={{
                root: "flex flex-col [@media(min-height:480px)]:h-dvh [@media(min-height:480px)]:overflow-hidden",
                main: "min-h-0 flex-1",
            }}
            header={
                <AppHeader>
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/">Home</TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/finances">Finances</TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Transactions</BreadcrumbPage>
                    </BreadcrumbItem>
                </AppHeader>
            }
            footer={<FinanceContainer.Footer />}
        >
            <div className="container mx-auto flex min-h-0 flex-1 flex-col gap-4 p-4 sm:flex-row lg:px-0">
                <h1 className="sr-only">Transactions</h1>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <Card
                        variant="flat"
                        className="flex min-h-0 flex-1 flex-col gap-4 border-0 bg-transparent lg:gap-px lg:border lg:bg-border"
                    >
                        <Card
                            variant="flat"
                            className="flex shrink-0 flex-col gap-0 py-0 lg:border-0"
                        >
                            <div className="flex items-center justify-between gap-2 p-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <MonthNavigation />
                                    <CardTitle variant="flat" className="min-w-0 truncate">
                                        {monthLabel}
                                    </CardTitle>
                                </div>
                                {isMobile && !isSearchOpen && (
                                    <Button
                                        ref={searchButtonRef}
                                        variant="ghost"
                                        size="icon-sm"
                                        className="-mr-1"
                                        onPress={() => setIsSearchOpen(true)}
                                        aria-label="Search transactions"
                                    >
                                        <SearchIcon />
                                    </Button>
                                )}
                            </div>
                            {isMobile && isSearchOpen && (
                                <div className="border-t border-subtle p-3">
                                    <TransactionSearch
                                        autoFocus
                                        onOpenChange={setIsSearchOpen}
                                        onClose={closeSearch}
                                    />
                                </div>
                            )}
                            <div className="border-t border-subtle p-3">
                                <TransactionFilters />
                            </div>
                        </Card>
                        <div className="flex min-h-0 flex-1 flex-col lg:contents">
                            <Card
                                variant="flat"
                                className="flex min-h-0 min-w-0 flex-1 flex-col py-0 lg:border-0"
                            >
                                <CardHeader variant="flat" className="shrink-0">
                                    <CardTitle variant="flat">Transactions</CardTitle>
                                </CardHeader>
                                <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
                                    {renderTransactionsContent()}
                                </CardContent>
                            </Card>
                            <SummaryCard
                                expenses={summary.expenses}
                                income={summary.income}
                                label={monthLabel}
                                expensesDimmed={search.type === "income"}
                                incomeDimmed={search.type === "expense"}
                                className="min-w-0 shrink-0 lg:border-0"
                            />
                        </div>
                    </Card>
                </div>
                {!isMobile && (
                    <aside className="w-64 shrink-0 lg:w-72 2xl:w-80">
                        <Card
                            variant="flat"
                            className="flex max-h-full flex-col gap-4 overflow-y-auto p-4"
                        >
                            <p className="shrink-0 text-xs font-medium text-muted-foreground">
                                Filters
                            </p>
                            <TransactionSearch />
                            <CategoryToggles
                                selectedCategories={selectedCategories}
                                onSelectionChange={(categories) =>
                                    navigateTransactionFilters({ categories })
                                }
                            />
                        </Card>
                    </aside>
                )}
            </div>
        </FinanceContainer.Root>
    );
}
