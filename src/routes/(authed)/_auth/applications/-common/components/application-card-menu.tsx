"use client";

import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import type { ApplicationStatus } from "@/generated/prisma/enums";

import { deleteApplicationFn } from "@/app/applications/applications.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import {
  APPLICATION_STATUS_DOT_STYLES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from "../constants";

type ApplicationCardMenuProps = {
  applicationId: string;
  status: ApplicationStatus;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

export const ApplicationCardMenu = ({
  applicationId,
  status,
  onStatusChange,
}: ApplicationCardMenuProps) => {
  const router = useRouter();
  const deleteApplication = useServerFn(deleteApplicationFn);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMove = (next: ApplicationStatus) => {
    if (next === status) {
      return;
    }

    onStatusChange(applicationId, next);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteApplication({ data: applicationId });
      await router.invalidate({ sync: true });
    } catch {
      // Leave the card in place; it was not deleted.
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon-sm" aria-label="Application actions">
          <MoreHorizontalIcon className="size-3.5" />
        </Button>
        <DropdownMenu className="w-48" placement="bottom end">
          <DropdownMenuGroup aria-label="Application actions">
            <DropdownMenuItem
              onAction={() =>
                router.navigate({ to: "/applications/$id", params: { id: applicationId } })
              }
            >
              Edit
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuGroup aria-label="Change status">
            {APPLICATION_STATUS_ORDER.map((value) => (
              <DropdownMenuItem
                key={value}
                textValue={APPLICATION_STATUS_LABELS[value]}
                isDisabled={value === status}
                onAction={() => handleMove(value)}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    APPLICATION_STATUS_DOT_STYLES[value],
                  )}
                />
                {APPLICATION_STATUS_LABELS[value]}
                {value === status && <CheckIcon className="ml-auto size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onAction={() => setIsDeleteOpen(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenu>
      </DropdownMenuTrigger>

      <AlertDialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this application?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the application. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onPress={() => setIsDeleteOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction isDisabled={isDeleting} onPress={handleDelete}>
            {isDeleting && <Spinner data-icon="inline-start" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </>
  );
};
