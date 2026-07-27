import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { PauseIcon, PlayIcon, Trash2 } from "lucide-react";
import { useState } from "react";

import { BackButton } from "@/components/back-button";
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
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import {
  deleteScheduledTransactionTemplateFn,
  getScheduledTransactionTemplatesFn,
  toggleScheduledTransactionTemplateFn,
} from "@/utils/scheduled-transactions.functions";

import { CATEGORY_COLORS, CATEGORY_LABELS, TRANSACTION_TYPE_COLORS } from "../../-common/constants";

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/(index)/")({
  loader: async () => {
    const templates = await getScheduledTransactionTemplatesFn();
    return { templates };
  },
  head: () => ({
    meta: [{ title: "Scheduled Transactions | Kevin Von Erich Peredo" }],
  }),
  component: RouteComponent,
});

type Template = Awaited<ReturnType<typeof getScheduledTransactionTemplatesFn>>[number];

function RouteComponent() {
  const { templates } = Route.useLoaderData();
  const router = useRouter();
  const deleteScheduledTransactionTemplate = useServerFn(deleteScheduledTransactionTemplateFn);
  const toggleScheduledTransactionTemplate = useServerFn(toggleScheduledTransactionTemplateFn);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleToggleActive = async (id: string) => {
    setIsLoading(id);
    try {
      await toggleScheduledTransactionTemplate({ data: id });
      await router.invalidate();
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteScheduledTransactionTemplate({ data: id });
      await router.invalidate();
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <div className="container mx-auto max-w-3xl p-4 pb-0">
        <div className="flex items-center gap-2">
          <BackButton variant="icon" className="self-center" to="/finances" />
          <h1 className="font-heading text-lg text-foreground">Scheduled Transactions</h1>
        </div>
      </div>

      <div className="container mx-auto my-4 flex max-w-3xl flex-1 flex-col gap-2 overflow-y-auto px-4 pb-8">
        {templates.length === 0 ? (
          <Card className="col-span-full py-6">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No scheduled transactions.</EmptyTitle>
                <EmptyDescription>
                  Create a transaction and enable scheduling to set one up.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          templates.map((template: Template) => {
            const day = template.dayOfMonth.toString().padStart(2, "0");
            const endCondition = template.endDate
              ? `Until ${format(parseISO(template.endDate), "MMM d, yyyy")}`
              : template.maxOccurrences
                ? `${template._count.transactions}/${template.maxOccurrences} occurrences`
                : "No end";
            return (
              <Card
                key={template.id}
                size="sm"
                role="group"
                aria-label={template.description}
                className={cn(
                  "min-h-[4.5rem] gap-0 border-l-2 p-0",
                  template.category
                    ? CATEGORY_COLORS[template.category as keyof typeof CATEGORY_COLORS]?.border
                    : "border-l-border",
                  !template.isActive && "opacity-50",
                )}
              >
                <CardContent className="flex min-w-0 p-0">
                  <div className="flex w-18 shrink-0 items-center justify-center border-r border-border px-3 font-mono text-xl text-foreground tabular-nums">
                    <span aria-hidden="true">{day}</span>
                    <span className="sr-only">Scheduled monthly on day {template.dayOfMonth}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-heading text-base text-foreground">
                        {template.description}
                      </span>
                      <div className="ml-auto flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          isDisabled={isLoading === template.id}
                          onPress={() => handleToggleActive(template.id)}
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
                              <AlertDialogTitle>
                                Delete this scheduled transaction?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Past transactions will be kept. No future instances will be
                                generated.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                isDisabled={isDeleting === template.id}
                                onPress={() => handleDelete(template.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialog>
                        </AlertDialogTrigger>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-1 font-mono text-xs whitespace-nowrap">
                      <span
                        className={cn(
                          "shrink-0 font-medium",
                          template.type === "income"
                            ? TRANSACTION_TYPE_COLORS.income
                            : TRANSACTION_TYPE_COLORS.expense,
                        )}
                      >
                        {template.type === "income" ? "+" : "-"}₱
                        {template.amount.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {template.category && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="truncate text-muted-foreground">
                            {CATEGORY_LABELS[template.category as keyof typeof CATEGORY_LABELS]}
                          </span>
                        </>
                      )}
                      <span className="shrink-0 text-muted-foreground">·</span>
                      <span className="shrink-0 text-muted-foreground">{endCondition}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
