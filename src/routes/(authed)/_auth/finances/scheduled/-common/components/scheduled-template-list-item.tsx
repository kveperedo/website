import { format, parseISO } from "date-fns";

import type { ScheduledTransactionStatus } from "@/generated/prisma/enums";

import { GridListItem } from "@/components/ui/grid-list";
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
        "flex min-w-0 items-stretch hover:bg-muted/50 focus-visible:bg-muted/50",
        onAction && "cursor-pointer",
        isMuted && "opacity-50",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center bg-muted px-2 font-mono text-xs text-foreground tabular-nums">
        <span aria-hidden="true">{day}</span>
        <span className="sr-only">Scheduled monthly on day {template.dayOfMonth}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 pl-1.5 font-mono text-xs">
        <span className="truncate text-foreground">{template.description}</span>
        <span className="flex min-w-0 items-center gap-1 text-xxs">
          <span
            className={cn(
              "shrink-0 font-medium",
              template.type === "income"
                ? TRANSACTION_TYPE_COLORS.income
                : TRANSACTION_TYPE_COLORS.expense,
            )}
          >
            {amount}
          </span>
          {template.category && template.category in CATEGORY_LABELS && (
            <>
              <span className="shrink-0 text-muted-foreground">·</span>
              <span className="truncate text-muted-foreground">
                {CATEGORY_LABELS[template.category as keyof typeof CATEGORY_LABELS]}
              </span>
            </>
          )}
          <span className="shrink-0 text-muted-foreground">·</span>
          <span className="shrink-0 text-muted-foreground">{endCondition}</span>
        </span>
      </div>
      {actions && (
        <div className="ml-auto flex shrink-0 items-center gap-1 self-center pl-1.5">{actions}</div>
      )}
    </GridListItem>
  );
};
