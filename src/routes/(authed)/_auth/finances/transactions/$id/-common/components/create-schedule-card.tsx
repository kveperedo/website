import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ScheduledFormSchema, type ScheduledFormData } from "@/schema/scheduled-transaction";
import { createScheduledTransactionTemplateFn } from "@/utils/scheduled-transactions.functions";

import { Route } from "../..";
import {
  DayOfMonthField,
  EndDateField,
  EndTypeField,
  MaxOccurrencesField,
} from "../../../-common/components/schedule-transaction-fields";

const generateDefaultSchedule = (transactedAt: Date): ScheduledFormData => ({
  endType: "none",
  dayOfMonth: new Date(transactedAt).getDate(),
});

export type CreateScheduleCardProps = {
  transactedAt: Date;
  isDisabled?: boolean;
};

export const CreateScheduleCard = ({ isDisabled, transactedAt }: CreateScheduleCardProps) => {
  const router = useRouter();
  const { transaction } = Route.useLoaderData();
  const { control, handleSubmit, reset } = useForm<ScheduledFormData>({
    resolver: zodResolver(ScheduledFormSchema),
    defaultValues: generateDefaultSchedule(transactedAt),
  });
  const createScheduledTransactionTemplate = useServerFn(createScheduledTransactionTemplateFn);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const watchEndType = useWatch({
    control,
    name: "endType",
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      reset(generateDefaultSchedule(transactedAt));
    }
  };

  const handleCreate = async (data: ScheduledFormData) => {
    setIsCreating(true);
    try {
      await createScheduledTransactionTemplate({
        data: {
          id: transaction.id,
          schedule: {
            dayOfMonth: data.dayOfMonth,
            endDate: data.endType === "date" ? (data.endDate ?? null) : null,
            maxOccurrences: data.endType === "count" ? (data.maxOccurrences ?? null) : null,
          },
        },
      });
      await router.invalidate();
      setIsOpen(false);
    } catch {
      // TODO: Add snackbar for error
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring schedule</CardTitle>
        <CardDescription>Create a monthly schedule from this transaction.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
          <Button variant="outline" isDisabled={isDisabled || isCreating}>
            Make recurring
          </Button>
          <Dialog>
            <DialogHeader>
              <DialogTitle>Make recurring</DialogTitle>
              <DialogDescription>
                This transaction becomes the first occurrence in a monthly schedule.
              </DialogDescription>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleCreate)}>
              <FieldGroup className="flex flex-col gap-4 border-t border-border pt-5">
                <DayOfMonthField control={control} name="dayOfMonth" />
                <EndTypeField control={control} name="endType" />
                {watchEndType === "date" && <EndDateField control={control} name="endDate" />}
                {watchEndType === "count" && (
                  <MaxOccurrencesField control={control} name="maxOccurrences" />
                )}
              </FieldGroup>
              <DialogFooter>
                <DialogClose variant="outline" isDisabled={isCreating}>
                  Cancel
                </DialogClose>
                <Button type="submit" isDisabled={isCreating}>
                  {isCreating && <Spinner data-icon="inline-start" />}
                  Create schedule
                </Button>
              </DialogFooter>
            </form>
          </Dialog>
        </DialogTrigger>
        {isDisabled && (
          <p className="text-xs text-muted-foreground">Save changes before creating a schedule.</p>
        )}
      </CardContent>
    </Card>
  );
};
