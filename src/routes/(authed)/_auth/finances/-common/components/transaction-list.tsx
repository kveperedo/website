import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";

import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";
import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { GridList, GridListCell, GridListItem } from "@/components/ui/grid-list";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { CATEGORY_COLORS, CATEGORY_LABELS, TRANSACTION_TYPE_COLORS } from "../constants";

export type TransactionRow = Pick<
    TransactionInputType,
    "category" | "description" | "templateId" | "transactedAt" | "type"
> & {
    id: string;
    amount: number;
};

type TransactionListProps = {
    transactions: Array<TransactionRow>;
    label: string;
    transactionSearch?: {
        year: number;
        month: number;
        q?: string;
        type?: TransactionType;
        categories?: Array<TransactionCategory>;
    };
};

export const TransactionList = ({
    transactions,
    label,
    transactionSearch,
}: TransactionListProps) => {
    const router = useRouter();

    return (
        <GridList
            items={transactions}
            aria-label={label}
            className="w-full gap-0 divide-y divide-subtle text-sm"
            onAction={(id) =>
                router.navigate({
                    to: "/finances/transactions/$id",
                    params: { id: String(id) },
                    search: (current) => ({ ...transactionSearch, ...current }),
                })
            }
        >
            {(transaction) => {
                const category = transaction.category as keyof typeof CATEGORY_LABELS | null;
                const amount = formatCurrency(transaction.amount, {
                    sign: transaction.type === "income" ? "positive" : "negative",
                });

                return (
                    <GridListItem
                        id={transaction.id}
                        data-transaction-id={transaction.id}
                        textValue={`${format(transaction.transactedAt, "MMMM d")}, ${transaction.description}, ${amount}`}
                        className={cn(
                            "grid grid-cols-[1fr_7rem] border-l-2 px-3 py-3 transition-colors",
                            category ? CATEGORY_COLORS[category]?.border : "border-l-transparent",
                            "cursor-pointer hover:bg-muted/20 focus-visible:bg-muted/20",
                        )}
                    >
                        <GridListCell className="pr-3 text-foreground">
                            <div className="flex min-h-8 items-center gap-3">
                                <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                                    {format(transaction.transactedAt, "dd")}
                                </span>
                                <div
                                    className={cn(
                                        "flex min-w-0 flex-col",
                                        !category && "justify-center",
                                    )}
                                >
                                    <span className="flex min-w-0 items-center gap-1 leading-5">
                                        <span className="min-w-0 flex-1 truncate">
                                            {transaction.description}
                                        </span>
                                        {transaction.templateId && (
                                            <span
                                                role="img"
                                                aria-label="Scheduled transaction"
                                                title="Scheduled transaction"
                                            >
                                                <CalendarClock
                                                    aria-hidden
                                                    className="size-3 text-muted-foreground"
                                                />
                                            </span>
                                        )}
                                    </span>
                                    {category && (
                                        <span className="text-xxs/3 text-muted-foreground">
                                            {CATEGORY_LABELS[category]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </GridListCell>
                        <GridListCell
                            className={cn(
                                "self-center text-right font-mono text-xs font-medium whitespace-nowrap",
                                transaction.type === "income"
                                    ? TRANSACTION_TYPE_COLORS.income
                                    : TRANSACTION_TYPE_COLORS.expense,
                            )}
                        >
                            {amount}
                        </GridListCell>
                    </GridListItem>
                );
            }}
        </GridList>
    );
};
