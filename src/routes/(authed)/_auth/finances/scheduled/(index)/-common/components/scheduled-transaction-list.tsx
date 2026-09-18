import { useRouter } from "@tanstack/react-router";
import { ArchiveIcon, PauseIcon, PlayIcon } from "lucide-react";

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

import { Route } from "../..";
import { ScheduledTemplateListItem } from "../../../-common/components/scheduled-template-list-item";

type ScheduledTransactionListProps = {
  label?: string;
  isLoading: string | null;
  isArchiving: string | null;
  onToggle: (id: string) => void;
  onArchive: (id: string) => void;
};

export const ScheduledTransactionList = ({
  label = "Scheduled transactions",
  isLoading,
  isArchiving,
  onToggle,
  onArchive,
}: ScheduledTransactionListProps) => {
  const { templates } = Route.useLoaderData();
  const router = useRouter();
  const isEmpty = templates.length === 0;

  const handleRowClick = (id: string) => {
    router.navigate({
      to: "/finances/scheduled/$id",
      params: { id },
    });
  };

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
            {templates.map((template) => (
              <ScheduledTemplateListItem
                key={template.id}
                template={template}
                onClick={handleRowClick}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      isDisabled={isLoading === template.id}
                      onPress={() => onToggle(template.id)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      aria-label={template.status === "active" ? "Pause" : "Resume"}
                    >
                      {template.status === "active" ? (
                        <PauseIcon className="size-3.5" />
                      ) : (
                        <PlayIcon className="size-3.5" />
                      )}
                    </Button>
                    <AlertDialogTrigger>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        isDisabled={isArchiving === template.id}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        aria-label="Archive template"
                      >
                        <ArchiveIcon className="size-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive this scheduled transaction?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Past transactions will be kept. No future instances will be generated.
                            Find it in Archived.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            isDisabled={isArchiving === template.id}
                            onPress={() => onArchive(template.id)}
                          >
                            Archive
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialog>
                    </AlertDialogTrigger>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
