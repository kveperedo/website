import type { JobApplicationInputType } from "@/generated/zod/schemas/variants/input/JobApplication.input";

import { getDb } from "@/app/infra/database/client.server";

export type ApplicationRecordInput = Required<JobApplicationInputType>;

export const findApplications = async () => {
  return await getDb().jobApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const findApplicationById = async (id: string) => {
  return await getDb().jobApplication.findUnique({ where: { id } });
};

export const createApplication = async (data: ApplicationRecordInput) => {
  return await getDb().jobApplication.create({ data });
};

export const updateApplication = async (id: string, data: Partial<ApplicationRecordInput>) => {
  return await getDb().jobApplication.update({ where: { id }, data });
};

export const deleteApplication = async (id: string) => {
  return await getDb().jobApplication.delete({ where: { id } });
};
