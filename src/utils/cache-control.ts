import { createIsomorphicFn } from "@tanstack/react-start";

export const cacheControl = createIsomorphicFn().server(
  async (value): Promise<Record<string, string>> => {
    const { env } = await import("cloudflare:workers");

    return env.E2E_PASSWORD ? {} : { "Cache-Control": value };
  },
);
