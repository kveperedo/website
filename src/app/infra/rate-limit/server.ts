import { getRequestIP } from "@tanstack/react-start/server";

import { getBinding } from "@/lib/env";

import { RateLimitError } from "./error";

export async function checkRateLimit(
  limit: number,
  windowMs: number,
  keyPrefix = "default",
): Promise<void> {
  const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
  const key = `ratelimit:${keyPrefix}:${ip}`;
  const kv = getBinding("website-rate-limit");

  const raw = await kv.get(key);
  const count = raw ? Number.parseInt(raw, 10) + 1 : 1;

  if (count > limit) {
    throw new RateLimitError();
  }

  const ttl = Math.max(60, Math.ceil(windowMs / 1000));
  await kv.put(key, count.toString(), { expirationTtl: ttl });
}
