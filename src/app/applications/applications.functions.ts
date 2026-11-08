import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authMiddleware } from "../auth/auth.middleware";
import { createRateLimitMiddleware } from "../infra/rate-limit/rate-limit.middleware";
import {
  CreateApplicationInputSchema,
  UpdateApplicationInputSchema,
  UpdateApplicationStatusInputSchema,
} from "./applications.schema";
import {
  changeApplicationStatus,
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
} from "./applications.service.server";

export const getApplicationsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(listApplications);

export const getApplicationByIdFn = createServerFn()
  .middleware([authMiddleware])
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await getApplication(data);
  });

export const createApplicationFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(CreateApplicationInputSchema)
  .handler(async ({ data }) => {
    return await createApplication(data);
  });

export const updateApplicationFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(UpdateApplicationInputSchema)
  .handler(async ({ data }) => {
    return await updateApplication(data);
  });

export const changeApplicationStatusFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(UpdateApplicationStatusInputSchema)
  .handler(async ({ data }) => {
    return await changeApplicationStatus(data);
  });

export const deleteApplicationFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .validator(z.uuid())
  .handler(async ({ data }) => {
    return await deleteApplication(data);
  });
