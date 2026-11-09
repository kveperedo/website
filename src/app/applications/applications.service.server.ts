import { dateOnlyToDatabaseDate, todayDateOnly } from "@/lib/date-only";

import type {
  ApplicationFields,
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateApplicationStatusInput,
} from "./applications.schema";

import {
  createApplication as createApplicationRecord,
  deleteApplication as deleteApplicationRecord,
  findApplicationById,
  findApplications,
  updateApplication as updateApplicationRecord,
} from "./applications.repository.server";

const toRecordFields = ({ appliedAt, ...data }: ApplicationFields) => ({
  ...data,
  appliedAt: appliedAt ? dateOnlyToDatabaseDate(appliedAt) : null,
});

export const listApplications = async () => {
  return await findApplications();
};

export const getApplication = async (id: string) => {
  return await findApplicationById(id);
};

const requireApplication = async (id: string) => {
  const application = await getApplication(id);

  if (!application) {
    throw new Error("Application not found.");
  }

  return application;
};

export const createApplication = async (input: CreateApplicationInput) => {
  return await createApplicationRecord(toRecordFields(input));
};

export const updateApplication = async ({ id, data }: UpdateApplicationInput) => {
  await requireApplication(id);

  return await updateApplicationRecord(id, toRecordFields(data));
};

export const changeApplicationStatus = async ({ id, status }: UpdateApplicationStatusInput) => {
  const application = await requireApplication(id);

  let appliedAt = application.appliedAt;

  if (status === "saved") {
    appliedAt = null;
  } else if (appliedAt === null) {
    appliedAt = dateOnlyToDatabaseDate(todayDateOnly());
  }

  return await updateApplicationRecord(id, { status, appliedAt });
};

export const deleteApplication = async (id: string) => {
  await requireApplication(id);

  return await deleteApplicationRecord(id);
};
