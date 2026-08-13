import { isRedirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { RateLimitError } from "./rate-limit/error";

const SLOW_READ_THRESHOLD_MS = 500;

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { errorName: error.name };
  }

  return { errorName: typeof error };
};

export const serverFunctionLoggingMiddleware = createMiddleware({ type: "function" }).server(
  async ({ method, next, serverFnMeta }) => {
    const startedAt = Date.now();

    try {
      const result = await next();
      const durationMs = Date.now() - startedAt;

      if (method === "POST" || durationMs >= SLOW_READ_THRESHOLD_MS) {
        console.info("server_function.completed", {
          durationMs,
          name: serverFnMeta.name,
          method,
        });
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      if (isRedirect(error)) {
        console.info("server_function.completed", {
          durationMs,
          name: serverFnMeta.name,
          method,
        });
      } else if (!(error instanceof RateLimitError)) {
        console.error("server_function.failed", {
          durationMs,
          name: serverFnMeta.name,
          method,
          ...getErrorDetails(error),
        });
      }

      throw error;
    }
  },
);
