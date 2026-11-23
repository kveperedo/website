import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";

import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";
import type { TransactionInputType } from "@/generated/zod/schemas/variants/input/Transaction.input";

import { GridList } from "@/components/ui/grid-list";
import { formatCurrency } from "@/lib/currency";

import { TransactionListItem } from "./transaction-list-item";

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
        >
            {(transaction) => {
                const formattedAmount = formatCurrency(transaction.amount, {
                    sign: transaction.type === "income" ? "positive" : "negative",
                });

                return (
                    <TransactionListItem
                        id={transaction.id}
                        dataTransactionId={transaction.id}
                        day={format(transaction.transactedAt, "dd")}
                        textValue={`${format(transaction.transactedAt, "MMMM d")}, ${transaction.description}, ${formattedAmount}`}
                        amount={transaction.amount}
                        type={transaction.type}
                        category={transaction.category as TransactionCategory | null}
                        onAction={(id) =>
                            router.navigate({
                                to: "/finances/transactions/$id",
                                params: { id },
                                search: (current) => ({ ...transactionSearch, ...current }),
                            })
                        }
                    >
                        <span className="min-w-0 flex-1 truncate">{transaction.description}</span>
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
                    </TransactionListItem>
                );
            }}
        </GridList>
    );
};
