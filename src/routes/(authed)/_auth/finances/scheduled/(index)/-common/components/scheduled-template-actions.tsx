import { ArchiveIcon, PauseIcon, PlayIcon } from "lucide-react";

import type { ScheduledTransactionStatus } from "@/generated/prisma/enums";

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

type ScheduledTemplateActionsProps = {
    id: string;
    status: ScheduledTransactionStatus;
    isLoading: boolean;
    isArchiving: boolean;
    onToggle: (id: string) => void;
    onArchive: (id: string) => void;
};

export const ScheduledTemplateActions = ({
    id,
    status,
    isLoading,
    isArchiving,
    onToggle,
    onArchive,
}: ScheduledTemplateActionsProps) => (
    <>
        <Button
            variant="ghost"
            size="icon-sm"
            isDisabled={isLoading}
            onPress={() => onToggle(id)}
            aria-label={status === "active" ? "Pause" : "Resume"}
        >
            {status === "active" ? (
                <PauseIcon className="size-3.5" />
            ) : (
                <PlayIcon className="size-3.5" />
            )}
        </Button>
        <AlertDialogTrigger>
            <Button
                variant="ghost"
                size="icon-sm"
                isDisabled={isArchiving}
                aria-label="Archive template"
            >
                <ArchiveIcon className="size-3.5" />
            </Button>
            <AlertDialog>
                <AlertDialogHeader>
                    <AlertDialogTitle>Archive this scheduled transaction?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Past transactions will be kept. No future instances will be generated. Find
                        it in Archived.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction isDisabled={isArchiving} onPress={() => onArchive(id)}>
                        Archive
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialog>
        </AlertDialogTrigger>
    </>
);
