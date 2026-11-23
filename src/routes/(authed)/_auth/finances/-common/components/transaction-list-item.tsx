import type { ReactNode } from "react";

import type { TransactionCategory, TransactionType } from "@/generated/prisma/enums";

import { GridListCell, GridListItem } from "@/components/ui/grid-list";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { CATEGORY_LABELS, TRANSACTION_TYPE_COLORS } from "../constants";

type TransactionListItemProps = {
    id: string;
    day: string;
    textValue: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory | null;
    dataTransactionId?: string;
    onAction?: (id: string) => void;
    children: ReactNode;
};

export const TransactionListItem = ({
    id,
    day,
    textValue,
    amount,
    type,
    category,
    dataTransactionId,
    onAction,
    children,
}: TransactionListItemProps) => {
    const formattedAmount = formatCurrency(amount, {
        sign: type === "income" ? "positive" : "negative",
    });

    return (
        <GridListItem
            id={id}
            data-transaction-id={dataTransactionId}
            textValue={textValue}
            onAction={onAction ? () => onAction(id) : undefined}
            className={cn(
                "grid cursor-pointer grid-cols-[1fr_7rem] px-2 py-2 transition-colors hover:bg-muted/20 focus-visible:bg-muted/20",
                !onAction && "cursor-default",
            )}
        >
            <GridListCell className="pr-3 text-foreground">
                <div className="flex min-h-8 items-center gap-3">
                    <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        {day}
                    </span>
                    <div className={cn("flex min-w-0 flex-col", !category && "justify-center")}>
                        <span className="flex min-w-0 items-center gap-1 leading-5">
                            {children}
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
                    type === "income"
                        ? TRANSACTION_TYPE_COLORS.income
                        : TRANSACTION_TYPE_COLORS.expense,
                )}
            >
                {formattedAmount}
            </GridListCell>
        </GridListItem>
    );
};
