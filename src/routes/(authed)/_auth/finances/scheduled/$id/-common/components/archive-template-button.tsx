import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArchiveIcon } from "lucide-react";
import { useState } from "react";

import { archiveScheduledTransactionTemplateFn } from "@/app/finance/scheduled-transactions/functions";
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
import { Spinner } from "@/components/ui/spinner";

import { Route } from "../..";

export const ArchiveTemplateButton = () => {
  const { template } = Route.useLoaderData();
  const router = useRouter();
  const archiveTemplate = useServerFn(archiveScheduledTransactionTemplateFn);
  const [isArchiving, setIsArchiving] = useState(false);
  const isArchived = template.status === "archived";

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveTemplate({ data: template.id });
      await router.invalidate({ sync: true });
      router.navigate({ to: "/finances/scheduled" });
    } catch {
      // TODO: Add snackbar for error
    } finally {
      setIsArchiving(false);
    }
  };

  if (isArchived) {
    return null;
  }

  return (
    <AlertDialogTrigger>
      <Button variant="outline" isDisabled={isArchiving}>
        <ArchiveIcon data-icon="inline-start" />
        Archive Schedule
      </Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this scheduled transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            Past transactions will be kept. No future instances will be generated. Find it in
            Archived.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction isDisabled={isArchiving} onPress={handleArchive}>
            {isArchiving && <Spinner data-icon="inline-start" />}
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  );
};
