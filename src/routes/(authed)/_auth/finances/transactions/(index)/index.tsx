import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { addMonths, format, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import type { TransactionItemAIType } from "@/schema/transaction";

import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { TransactionInput } from "@/routes/(authed)/_auth/finances/-common/components/transaction-input";
import { TransactionTable } from "@/routes/(authed)/_auth/finances/-common/components/transaction-table";
import { getTransactionsByMonthFn } from "@/utils/transactions.function";

const searchSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/(authed)/_auth/finances/transactions/(index)/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { year, month, q } }) => ({ year, month, q }),
  loader: async ({ deps }) => {
    const year = deps.year ?? new Date().getFullYear();
    const month = deps.month ?? new Date().getMonth() + 1;
    const transactions = await getTransactionsByMonthFn({
      data: { year, month, q: deps.q || undefined },
    });
    const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");
    return { transactions, monthLabel, year, month };
  },
  head: ({ loaderData }) => {
    const { year, month } = loaderData!;

    const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");
    return { meta: [{ title: `${monthLabel} Transactions | Kevin Von Erich Peredo` }] };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { transactions, monthLabel, year, month } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const current = new Date(year, month - 1);
  const prevDate = subMonths(current, 1);
  const nextDate = addMonths(current, 1);
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const [inputValue, setInputValue] = useState(search.q ?? "");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const nextQ = inputValue.trim() || undefined;
      if (nextQ !== (search.q ?? undefined)) {
        router.navigate({
          to: "/finances/transactions",
          search: { year, month, q: nextQ },
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val === "" && search.q) {
      router.navigate({
        to: "/finances/transactions",
        search: { year, month, q: undefined },
      });
    }
  };

  const handleClear = () => {
    setInputValue("");
    router.navigate({
      to: "/finances/transactions",
      search: { year, month, q: undefined },
    });
  };

  const handleParsed = (transactions: Array<TransactionItemAIType>) => {
    router.navigate({
      to: "/finances/new",
      search: { transactions, returnTo: "/finances/transactions" },
    });
  };

  const hasNoTransactions = transactions.length === 0;
  const hasNoResults = hasNoTransactions && search.q;

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <div className="container mx-auto max-w-2xl p-4 pb-0">
        <div className="flex items-center gap-2">
          <BackButton variant="icon" className="self-center" />
          <div className="relative flex-1">
            <Input
              className="pr-10"
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${monthLabel} transactions`}
              aria-label={`Search ${monthLabel} transactions`}
            />
            {inputValue ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleClear}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </Button>
            ) : (
              <SearchIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="secondary"
              size="icon"
              nativeButton={false}
              render={
                <Link
                  to="/finances/transactions"
                  search={{
                    year: prevDate.getFullYear(),
                    month: prevDate.getMonth() + 1,
                    q: search.q || undefined,
                  }}
                />
              }
              aria-label="Previous month"
            >
              <ChevronLeft />
            </Button>
            {isCurrentMonth ? (
              <Button variant="secondary" size="icon" disabled aria-label="Next month">
                <ChevronRight />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="icon"
                nativeButton={false}
                render={
                  <Link
                    to="/finances/transactions"
                    search={{
                      year: nextDate.getFullYear(),
                      month: nextDate.getMonth() + 1,
                      q: search.q || undefined,
                    }}
                  />
                }
                aria-label="Next month"
              >
                <ChevronRight />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto my-4 flex max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-4 pb-8">
        {hasNoResults ? (
          <Card className="py-6">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No transactions match &ldquo;{search.q}&rdquo;.</EmptyTitle>
                <EmptyDescription>Try a different search term.</EmptyDescription>
              </EmptyHeader>
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
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="container mx-auto max-w-2xl px-4 pb-6">
        <TransactionInput onParsed={handleParsed} />
      </div>
    </main>
  );
}
