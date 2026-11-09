"use client";

import { useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import type { ApplicationFields } from "@/app/applications/applications.schema";

import { createApplicationFn } from "@/app/applications/applications.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

import {
  ApplicationAppliedAtField,
  CompanyTextField,
  LinkTextField,
  NotesTextareaField,
  PositionTextField,
} from "./application-fields";
import { ApplicationForm, type ApplicationFormRenderProps } from "./application-form";

const PANEL_FORM_ID = "create-application-panel";
const DIALOG_FORM_ID = "create-application-dialog";

const DEFAULT_VALUES: ApplicationFields = {
  position: "",
  company: "",
  link: "",
  status: "saved",
  appliedAt: null,
  notes: null,
};

const CreateApplicationFields = ({ isDisabled }: ApplicationFormRenderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <PositionTextField isDisabled={isDisabled} />
      <CompanyTextField isDisabled={isDisabled} />

      <FieldGroup className="gap-4">
        <LinkTextField isDisabled={isDisabled} />
        <ApplicationAppliedAtField isDisabled={isDisabled} />
        <NotesTextareaField isDisabled={isDisabled} />
      </FieldGroup>
    </div>
  );
};

const useCreateApplication = (onSuccess?: () => void) => {
  const router = useRouter();
  const view = useRouterState({
    select: (state) => (state.location.search as { view?: string }).view,
  });
  const createApplication = useServerFn(createApplicationFn);
  const [isSaving, setIsSaving] = useState(false);

  const create = async (data: ApplicationFields) => {
    setIsSaving(true);
    try {
      await createApplication({ data: { ...data, status: "saved", appliedAt: null } });
      await router.invalidate({ sync: true });
      if (view === "closed") {
        await router.navigate({ to: "/applications" });
      }
      onSuccess?.();
    } finally {
      setIsSaving(false);
    }
  };

  return { create, isSaving };
};

export const CreateApplicationPanel = () => {
  const { create, isSaving } = useCreateApplication();

  return (
    <aside className="hidden w-72 shrink-0 xl:block 2xl:w-80">
      <div className="flex max-h-full flex-col gap-3 overflow-y-auto border border-border/50 bg-card p-4">
        <p className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Add application
        </p>
        <ApplicationForm
          formId={PANEL_FORM_ID}
          defaultValues={DEFAULT_VALUES}
          resetTo={DEFAULT_VALUES}
          onSubmit={create}
          isDisabled={isSaving}
        >
          {CreateApplicationFields}
        </ApplicationForm>
        <Button type="submit" form={PANEL_FORM_ID} isDisabled={isSaving} className="w-full">
          {isSaving && <Spinner data-icon="inline-start" />}
          Add application
        </Button>
      </div>
    </aside>
  );
};

export const CreateApplicationDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { create, isSaving } = useCreateApplication(() => setIsOpen(false));

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button size="sm" className="xl:hidden">
        <PlusIcon className="size-3.5" />
        New application
      </Button>
      <Dialog className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New application</DialogTitle>
          <DialogDescription>
            Save a job listing, or log one you have already applied to.
          </DialogDescription>
        </DialogHeader>
        <ApplicationForm
          formId={DIALOG_FORM_ID}
          defaultValues={DEFAULT_VALUES}
          resetTo={DEFAULT_VALUES}
          onSubmit={create}
          isDisabled={isSaving}
        >
          {CreateApplicationFields}
        </ApplicationForm>
        <DialogFooter>
          <Button variant="secondary" onPress={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={DIALOG_FORM_ID} isDisabled={isSaving}>
            {isSaving && <Spinner data-icon="inline-start" />}
            Add application
          </Button>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  );
};
