import { addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TanstackLinkButton } from "@/components/ui/button";
import { formatLocal } from "@/lib/date-only";

import { Route } from "../..";

export function MonthNavigation() {
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
        <div className="flex shrink-0 items-center gap-0.5">
            <TanstackLinkButton
                to="/finances/transactions"
                search={{
                    ...transactionSearch,
                    year: previousDate.getFullYear(),
                    month: previousDate.getMonth() + 1,
                }}
                variant="ghost"
                size="icon-sm"
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
                variant="ghost"
                size="icon-sm"
                aria-label={`Next month, ${formatLocal(nextDate, "MMMM yyyy")}`}
            >
                <ChevronRight />
            </TanstackLinkButton>
        </div>
    );
}
