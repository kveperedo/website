import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { deleteScheduledTransactionTemplateFn } from "@/app/finance/scheduled-transactions/functions";
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

export const DeleteTemplateButton = () => {
  const { template } = Route.useLoaderData();
  const router = useRouter();
  const deleteTemplate = useServerFn(deleteScheduledTransactionTemplateFn);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTemplate({ data: template.id });
      await router.invalidate({ sync: true });
      router.navigate({ to: "/finances/scheduled" });
    } catch {
      // TODO: Add snackbar for error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialogTrigger>
      <Button variant="destructive" isDisabled={isDeleting}>
        Delete Schedule
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
          <AlertDialogAction variant="destructive" isDisabled={isDeleting} onPress={handleDelete}>
            {isDeleting && <Spinner data-icon="inline-start" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  );
};
