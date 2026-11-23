import { useRouter } from "@tanstack/react-router";

import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

import { Route } from "..";

export function useTransactionFilterNavigation() {
    const { year, month } = Route.useLoaderData();
    const router = useRouter();

    return (
        next: {
            type?: TransactionType;
            categories?: Array<TransactionCategory>;
        } = {},
    ) => {
        router.navigate({
            to: "/finances/transactions",
            search: (current) => {
                const type = "type" in next ? next.type : current.type;
                const categories =
                    ("categories" in next ? next.categories : current.categories) ?? [];

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
}
