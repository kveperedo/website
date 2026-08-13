import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authMiddleware } from "../auth/middleware";
import { createRateLimitMiddleware } from "../infra/rate-limit/middleware";
import {
  isE2EAvailable,
  requireE2EAvailable,
  resetTestData,
  seedTestData,
  seedTrendsTestData,
} from "./server";

const NetCardScenarioSchema = z
  .enum(["below-pace", "no-history", "on-pace", "over-income"])
  .optional();

export const getIsE2EAvailableFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    return isE2EAvailable();
  });

export const resetTestDataFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .handler(async () => {
    requireE2EAvailable();
    await resetTestData();
  });

export const seedTestDataFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .inputValidator(NetCardScenarioSchema)
  .handler(async ({ data }) => {
    requireE2EAvailable();
    await seedTestData(data);
  });

export const seedTrendsTestDataFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, createRateLimitMiddleware()])
  .handler(async () => {
    requireE2EAvailable();
    await seedTrendsTestData();
  });
