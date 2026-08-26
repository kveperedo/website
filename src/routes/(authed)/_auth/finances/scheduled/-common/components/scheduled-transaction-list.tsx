import { format, parseISO } from "date-fns";
import { PauseIcon, PlayIcon, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { Route } from "../../(index)";
import { CATEGORY_LABELS, TRANSACTION_TYPE_COLORS } from "../../../-common/constants";

type ScheduledTransactionListProps = {
  label?: string;
  isLoading: string | null;
  isDeleting: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export const ScheduledTransactionList = ({
  label = "Scheduled transactions",
  isLoading,
  isDeleting,
  onToggle,
  onDelete,
}: ScheduledTransactionListProps) => {
  const { templates } = Route.useLoaderData();
  const isEmpty = templates.length === 0;

  return (
    <Card className="flex min-w-0 flex-1 flex-col p-2">
      <CardContent className="flex flex-col gap-2 p-2">
        <CardTitle className="text-muted-foreground">Scheduled transactions</CardTitle>
        {isEmpty ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No scheduled transactions.</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2" aria-label={label}>
            {templates.map((template) => {
              const day = template.dayOfMonth.toString().padStart(2, "0");
              const endCondition = template.endDate
                ? `Until ${format(parseISO(template.endDate), "MMM d, yyyy")}`
                : template.maxOccurrences
                  ? `${template._count.transactions}/${template.maxOccurrences} occurrences`
                  : "No end";
              return (
                <li
                  key={template.id}
                  data-template-id={template.id}
                  className={cn("flex min-w-0 items-stretch", !template.isActive && "opacity-50")}
                  aria-label={`${template.description}, scheduled monthly on day ${template.dayOfMonth}`}
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
                        {formatCurrency(template.amount, {
                          sign: template.type === "income" ? "positive" : "negative",
                        })}
                      </span>
                      {template.category && (
                        <>
                          <span className="shrink-0 text-muted-foreground">·</span>
                          <span className="truncate text-muted-foreground">
                            {CATEGORY_LABELS[template.category]}
                          </span>
                        </>
                      )}
                      <span className="shrink-0 text-muted-foreground">·</span>
                      <span className="shrink-0 text-muted-foreground">{endCondition}</span>
                    </span>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1 self-center pl-1.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      isDisabled={isLoading === template.id}
                      onPress={() => onToggle(template.id)}
                      aria-label={template.isActive ? "Pause" : "Resume"}
                    >
                      {template.isActive ? (
                        <PauseIcon className="size-3.5" />
                      ) : (
                        <PlayIcon className="size-3.5" />
                      )}
                    </Button>
                    <AlertDialogTrigger>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        isDisabled={isDeleting === template.id}
                        aria-label="Delete template"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this scheduled transaction?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Past transactions will be kept. No future instances will be generated.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            isDisabled={isDeleting === template.id}
                            onPress={() => onDelete(template.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialog>
                    </AlertDialogTrigger>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
