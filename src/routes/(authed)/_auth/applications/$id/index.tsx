import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { ApplicationFields } from "@/app/applications/applications.schema";

import {
  getApplicationByIdFn,
  updateApplicationFn,
} from "@/app/applications/applications.functions";
import { AppContainer } from "@/components/app-container";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { databaseDateToDateOnly } from "@/lib/date-only";

import {
  ApplicationAppliedAtField,
  ApplicationStatusField,
  CompanyTextField,
  LinkTextField,
  NotesTextareaField,
  PositionTextField,
} from "../-common/components/application-fields";
import { ApplicationForm, FORM_ID } from "../-common/components/application-form";
import { DeleteApplicationButton } from "../-common/components/delete-application-button";

export const Route = createFileRoute("/(authed)/_auth/applications/$id/")({
  loader: async ({ params }) => {
    const application = await getApplicationByIdFn({ data: params.id });
    return { application };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.application.position ?? "Application"} | Kevin Von Erich Peredo`,
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { application } = Route.useLoaderData();
  const updateApplication = useServerFn(updateApplicationFn);
  const [isSaving, setIsSaving] = useState(false);

  const defaultValues: ApplicationFields = {
    position: application.position,
    company: application.company,
    link: application.link,
    status: application.status,
    appliedAt: application.appliedAt ? databaseDateToDateOnly(application.appliedAt) : null,
    notes: application.notes,
  };

  const handleBack = () => {
    router.navigate({ to: "/applications" });
  };

  const handleSubmit = async (data: ApplicationFields) => {
    setIsSaving(true);
    try {
      await updateApplication({ data: { id: application.id, data } });
      await router.invalidate();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppContainer
      classNames={{
        root: "flex flex-col",
        main: "flex-1",
      }}
      header={
        <div className="flex items-center gap-3">
          <BackButton to="/applications" variant="icon" />
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <h1 className="min-w-0 truncate font-heading text-lg font-medium text-foreground">
              {application.position}
            </h1>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {application.company}
            </span>
          </div>
          <DeleteApplicationButton
            applicationId={application.id}
            onDeleted={() => router.navigate({ to: "/applications" })}
          />
        </div>
      }
      footer={
        <div className="container mx-auto flex h-16 items-center justify-end gap-4 px-4">
          <Button variant="secondary" onPress={handleBack} isDisabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isDisabled={isSaving}>
            {isSaving && <Spinner data-icon="inline-start" />}
            Save changes
          </Button>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
        <ApplicationForm
          className="flex-1"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isDisabled={isSaving}
        >
          {({ isDisabled }) => (
            <Card className="flex flex-1 flex-col gap-5 p-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <PositionTextField isDisabled={isDisabled} />
                <CompanyTextField isDisabled={isDisabled} />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <ApplicationStatusField isDisabled={isDisabled} />
                <LinkTextField isDisabled={isDisabled} />
              </div>

              <FieldGroup className="border-t border-border pt-5">
                <ApplicationAppliedAtField isDisabled={isDisabled} />
                <NotesTextareaField isDisabled={isDisabled} />
              </FieldGroup>
            </Card>
          )}
        </ApplicationForm>
      </div>
    </AppContainer>
  );
}
