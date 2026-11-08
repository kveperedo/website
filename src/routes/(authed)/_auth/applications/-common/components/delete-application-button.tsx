"use client";

import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";

import { deleteApplicationFn } from "@/app/applications/applications.functions";
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

type DeleteApplicationButtonProps = {
  applicationId: string;
  onDeleted?: () => void;
};

export const DeleteApplicationButton = ({
  applicationId,
  onDeleted,
}: DeleteApplicationButtonProps) => {
  const router = useRouter();
  const deleteApplication = useServerFn(deleteApplicationFn);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteApplication({ data: applicationId });
      await router.invalidate({ sync: true });
      onDeleted?.();
    } catch {
      // Leave the application in place; it was not deleted.
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialogTrigger>
      <Button
        variant="ghost"
        size="icon-sm"
        isDisabled={isDeleting}
        aria-label="Delete application"
      >
        <Trash2Icon className="size-3.5" />
      </Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this application?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the application. This cannot be undone.
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
