import { redirect } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateLimitError } from "./rate-limit-error";
import { serverFunctionLoggingMiddleware } from "./server-function-logging.middleware";

const runMiddleware = (method: "GET" | "POST", next: () => Promise<unknown>) => {
  const server = serverFunctionLoggingMiddleware.options.server;

  if (!server) {
    throw new Error("Server logging middleware is not configured");
  }

  return server({
    context: {},
    data: {},
    method,
    next,
    serverFnMeta: { filename: "src/utils/example.functions.ts", id: "test", name: "exampleFn" },
    signal: new AbortController().signal,
  } as never);
};

describe("serverFunctionLoggingMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs successful mutations", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await runMiddleware("POST", async () => ({ context: {}, sendContext: {} }));

    expect(info).toHaveBeenCalledWith("server_function.completed", {
      durationMs: expect.any(Number),
      method: "POST",
      name: "exampleFn",
    });
  });

  it("logs reads only when they exceed the slow-read threshold", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValueOnce(500);

    await runMiddleware("GET", async () => ({ context: {}, sendContext: {} }));

    expect(info).toHaveBeenCalledWith("server_function.completed", {
      durationMs: 500,
      method: "GET",
      name: "exampleFn",
    });
  });

  it("logs and rethrows non-rate-limit failures", async () => {
    const error = new Error("Database unavailable: password=secret");
    const errorLogger = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(runMiddleware("GET", async () => Promise.reject(error))).rejects.toBe(error);

    expect(errorLogger).toHaveBeenCalledWith("server_function.failed", {
      durationMs: expect.any(Number),
      errorName: "Error",
      method: "GET",
      name: "exampleFn",
    });
    expect(errorLogger).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ errorMessage: error.message }),
    );
  });

  it("does not log rate-limit rejections", async () => {
    const errorLogger = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      runMiddleware("POST", async () => Promise.reject(new RateLimitError())),
    ).rejects.toThrow(RateLimitError);

    expect(errorLogger).not.toHaveBeenCalled();
  });

  it("logs redirects as successful completions", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = redirect({ to: "/login" });

    await expect(runMiddleware("POST", async () => Promise.reject(error))).rejects.toBe(error);

    expect(info).toHaveBeenCalledWith("server_function.completed", {
      durationMs: expect.any(Number),
      method: "POST",
      name: "exampleFn",
    });
  });
});
