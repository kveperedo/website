import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { deleteTransactionFn } from "@/app/finance/transactions/functions";
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

export const DeleteTransactionButton = () => {
  const { transaction } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const deleteTransaction = useServerFn(deleteTransactionFn);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction({ data: transaction.id });
      router.navigate({
        to: "/finances/transactions",
        search: {
          year: search.year,
          month: search.month,
          q: search.q || undefined,
          type: search.type,
          categories: search.categories,
        },
      });
    } catch {
      // TODO: Add snackbar for error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialogTrigger>
      <Button variant="destructive" isDisabled={isDeleting}>
        Delete Transaction
      </Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this transaction.
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
