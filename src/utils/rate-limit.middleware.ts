import { createMiddleware } from "@tanstack/react-start";

import { checkRateLimit } from "./rate-limit.server";

export function createRateLimitMiddleware(opts?: { limit?: number; windowMs?: number }) {
  const limit = opts?.limit ?? 20;
  const windowMs = opts?.windowMs ?? 60_000;

  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    await checkRateLimit(limit, windowMs);
    return next();
  });
}
