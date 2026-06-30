import { getRequestIP } from "@tanstack/react-start/server";

import { requireEnv } from "#/lib/env";

const API_TOKEN = requireEnv("CLOUDFLARE_API_TOKEN");
const ACCOUNT_ID = requireEnv("CLOUDFLARE_ACCOUNT_ID");
const KV_NAMESPACE_ID = requireEnv("CLOUDFLARE_KV_NAMESPACE_ID");

const API_BASE = "https://api.cloudflare.com/client/v4/";

async function cfFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Cloudflare API error: ${res.status}`, body);
    throw new Error(`Cloudflare API returned ${res.status}`);
  }

  return res;
}

export async function checkRateLimit(limit: number, windowMs: number): Promise<void> {
  const ip = getRequestIP({ xForwardedFor: true }) ?? crypto.randomUUID();
  const key = `ratelimit:${ip}`;

  let count = 1;
  try {
    const res = await cfFetch(
      `accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`,
    );

    const text = await res.text();

    if (text) {
      count = Number.parseInt(text, 10) + 1;
    }
  } catch {
    // Key doesn't exist or KV unavailable — start fresh
  }

  if (count > limit) {
    throw new Error("Too many requests. Try again later.");
  }

  const ttl = Math.max(60, Math.ceil(windowMs / 1000));

  try {
    await cfFetch(
      `accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}?expiration_ttl=${ttl}`,
      {
        method: "PUT",
        body: count.toString(),
        headers: { "Content-Type": "text/plain" },
      },
    );
  } catch {
    throw new Error("Failed to update rate limit");
  }
}
