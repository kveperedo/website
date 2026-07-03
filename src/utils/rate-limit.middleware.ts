import { createMiddleware } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import { checkRateLimit } from "./rate-limit.server";

export function createRateLimitMiddleware(opts?: { limit?: number; windowMs?: number }) {
  const limit = opts?.limit ?? 20;
  const windowMs = opts?.windowMs ?? 60_000;

  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    if (import.meta.env.DEV || env.E2E_PASSWORD) {
      return next();
    }

    await checkRateLimit(limit, windowMs);
    return next();
  });
}
