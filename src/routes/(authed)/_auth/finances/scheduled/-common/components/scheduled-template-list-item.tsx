import { format, parseISO } from "date-fns";

import type { ScheduledTransactionStatus } from "@/generated/prisma/enums";

import { GridListCell, GridListItem } from "@/components/ui/grid-list";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
    CATEGORY_LABELS,
    TRANSACTION_TYPE_COLORS,
} from "@/routes/(authed)/_auth/finances/-common/constants";

type ScheduledTemplate = {
    id: string;
    dayOfMonth: number;
    description: string;
    amount: number;
    type: "expense" | "income";
    category: string | null;
    endDate: string | null;
    maxOccurrences: number | null;
    _count: { transactions: number };
    status: ScheduledTransactionStatus;
};

type ScheduledTemplateListItemProps = {
    template: ScheduledTemplate;
    onAction?: (id: string) => void;
    actions?: React.ReactNode;
};

export const ScheduledTemplateListItem = ({
    template,
    onAction,
    actions,
}: ScheduledTemplateListItemProps) => {
    const day = template.dayOfMonth.toString().padStart(2, "0");

    const getEndCondition = () => {
        if (template.endDate) {
            return `Until ${format(parseISO(template.endDate), "MMM d, yyyy")}`;
        }
        if (template.maxOccurrences) {
            return `${template._count.transactions}/${template.maxOccurrences} occurrences`;
        }
        return "No end";
    };

    const endCondition = getEndCondition();
    const isMuted = template.status === "paused";
    const amount = formatCurrency(template.amount, {
        sign: template.type === "income" ? "positive" : "negative",
    });

    return (
        <GridListItem
            id={template.id}
            data-template-id={template.id}
            textValue={`${template.description}, ${amount}, ${endCondition}`}
            onAction={onAction ? () => onAction(template.id) : undefined}
            className={cn(
                "grid cursor-pointer grid-cols-[1fr_auto] px-2 py-2 transition-colors hover:bg-muted/20 focus-visible:bg-muted/20",
                !onAction && "cursor-default",
                isMuted && "opacity-50",
            )}
        >
            <GridListCell className="pr-3 text-foreground">
                <div className="flex min-h-8 items-center gap-3">
                    <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        <span aria-hidden="true">{day}</span>
                        <span className="sr-only">
                            Scheduled monthly on day {template.dayOfMonth}
                        </span>
                    </span>
                    <div className="flex min-w-0 flex-col justify-center">
                        <span className="truncate leading-5">{template.description}</span>
                        <span className="flex min-w-0 items-center gap-1 text-xxs/3 text-muted-foreground">
                            {template.category && template.category in CATEGORY_LABELS && (
                                <>
                                    <span className="truncate">
                                        {
                                            CATEGORY_LABELS[
                                                template.category as keyof typeof CATEGORY_LABELS
                                            ]
                                        }
                                    </span>
                                    <span aria-hidden>·</span>
                                </>
                            )}
                            <span className="shrink-0">{endCondition}</span>
                        </span>
                    </div>
                </div>
            </GridListCell>
            <GridListCell className="flex items-center gap-2 self-center">
                <span
                    className={cn(
                        "font-mono text-xs font-medium whitespace-nowrap",
                        template.type === "income"
                            ? TRANSACTION_TYPE_COLORS.income
                            : TRANSACTION_TYPE_COLORS.expense,
                    )}
                >
                    {amount}
                </span>
                {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
            </GridListCell>
        </GridListItem>
    );
};
