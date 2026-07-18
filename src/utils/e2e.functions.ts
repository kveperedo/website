import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "./auth.middleware";
import { isE2EAvailable, requireE2EAvailable, resetTestData, seedTestData } from "./e2e.server";
import { createRateLimitMiddleware } from "./rate-limit.middleware";

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
  .handler(async () => {
    requireE2EAvailable();
    await seedTestData();
  });
