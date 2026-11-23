import type { TransactionType } from "@/generated/prisma/enums";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CategoryFilter } from "@/routes/(authed)/_auth/finances/-common/components/category-filter";

import { Route } from "../..";
import { useTransactionFilterNavigation } from "../use-transaction-filter-navigation";

const TRANSACTION_TYPE_DOT_STYLES = {
    income: "bg-emerald-400",
    expense: "bg-destructive",
} as const;

export function TransactionFilters() {
    const search = Route.useSearch();
    const selectedCategories = search.categories ?? [];
    const navigate = useTransactionFilterNavigation();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Tabs
                selectedKey={search.type ?? "all"}
                onSelectionChange={(key) => {
                    const type = (key as TransactionType | "all" | null) ?? "all";
                    navigate({
                        type: type === "all" ? undefined : type,
                        categories: type === "income" ? [] : selectedCategories,
                    });
                }}
                className="gap-0"
            >
                <TabsList variant="line" aria-label="Transaction type" className="flex-wrap">
                    <TabsTrigger id="all">All</TabsTrigger>
                    <TabsTrigger id="expense">
                        <span
                            aria-hidden
                            className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                TRANSACTION_TYPE_DOT_STYLES.expense,
                            )}
                        />
                        Expenses
                    </TabsTrigger>
                    <TabsTrigger id="income">
                        <span
                            aria-hidden
                            className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                TRANSACTION_TYPE_DOT_STYLES.income,
                            )}
                        />
                        Income
                    </TabsTrigger>
                </TabsList>
                <TabsContent id="all" className="sr-only" />
                <TabsContent id="expense" className="sr-only" />
                <TabsContent id="income" className="sr-only" />
            </Tabs>
            {search.type !== "income" && (
                <div className="ml-auto sm:hidden">
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
