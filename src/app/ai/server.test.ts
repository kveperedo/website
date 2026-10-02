import { APICallError, NoObjectGeneratedError } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { AIRequestTimeoutError, embedTexts, generateJson } from "./server";

const { generateTextMock, embedManyMock } = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  embedManyMock: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: generateTextMock,
  embedMany: embedManyMock,
}));

vi.mock("workers-ai-provider", () => ({
  createWorkersAI: () => Object.assign(() => ({}), { textEmbedding: () => ({}) }),
}));

vi.mock("@/lib/env", () => ({ getBinding: () => ({}) }));

const never = () => new Promise<never>(() => {});

const internalError = () =>
  new APICallError({
    message: "Error: internal error",
    url: "workers-ai:binding/run",
    requestBodyValues: {},
    isRetryable: false,
  });

const badRequest = () =>
  new APICallError({
    message: "Bad request",
    url: "workers-ai:binding/run",
    requestBodyValues: {},
    statusCode: 400,
  });

const malformedOutput = () =>
  new NoObjectGeneratedError({
    message: "No object generated: could not parse the response.",
    text: "{ not json",
    response: { id: "1", timestamp: new Date(0), modelId: "test" },
    usage: {} as ConstructorParameters<typeof NoObjectGeneratedError>[0]["usage"],
    finishReason: "stop",
  });

const parse = (options: { timeoutMs?: number; retries?: number }) =>
  generateJson({
    instructions: "parse",
    messages: [{ role: "user", content: "1. lunch 150" }],
    schema: z.object({ ok: z.boolean() }),
    ...options,
  });

describe("generateJson", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    generateTextMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cuts off a hung call and retries it", async () => {
    generateTextMock.mockImplementationOnce(never).mockResolvedValueOnce({ output: { ok: true } });

    const result = parse({ timeoutMs: 1_000, retries: 1 });
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(result).resolves.toEqual({ ok: true });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("aborts the hung attempt so the provider can stop", async () => {
    generateTextMock.mockImplementationOnce(never).mockResolvedValueOnce({ output: { ok: true } });

    const result = parse({ timeoutMs: 1_000, retries: 1 });
    await vi.advanceTimersByTimeAsync(1_000);
    await result;

    const [{ abortSignal }] = generateTextMock.mock.calls[0];
    expect(abortSignal.aborted).toBe(true);
    expect(abortSignal.reason).toBeInstanceOf(AIRequestTimeoutError);
  });

  it("retries provider errors the SDK marks non-retryable", async () => {
    generateTextMock
      .mockRejectedValueOnce(internalError())
      .mockResolvedValueOnce({ output: { ok: true } });

    await expect(parse({ retries: 1 })).resolves.toEqual({ ok: true });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("retries output that fails the schema", async () => {
    generateTextMock
      .mockRejectedValueOnce(malformedOutput())
      .mockResolvedValueOnce({ output: { ok: true } });

    await expect(parse({ retries: 1 })).resolves.toEqual({ ok: true });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry 4xx provider errors", async () => {
    generateTextMock.mockRejectedValueOnce(badRequest());

    await expect(parse({ retries: 1 })).rejects.toThrow("Bad request");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("disables the SDK's own retries so timing stays bounded", async () => {
    generateTextMock.mockResolvedValueOnce({ output: { ok: true } });

    await parse({});

    expect(generateTextMock).toHaveBeenCalledWith(expect.objectContaining({ maxRetries: 0 }));
  });

  it("gives up after the last attempt times out", async () => {
    generateTextMock.mockImplementation(never);

    const result = parse({ timeoutMs: 1_000, retries: 1 });
    const assertion = expect(result).rejects.toBeInstanceOf(AIRequestTimeoutError);
    await vi.advanceTimersByTimeAsync(2_000);

    await assertion;
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry errors that are not from the provider", async () => {
    generateTextMock.mockRejectedValueOnce(new TypeError("bad schema"));

    await expect(parse({ retries: 1 })).rejects.toThrow("bad schema");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });
});

describe("embedTexts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    embedManyMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not retry by default", async () => {
    embedManyMock.mockImplementation(never);

    const result = embedTexts(["lunch"], { timeoutMs: 500 });
    const assertion = expect(result).rejects.toBeInstanceOf(AIRequestTimeoutError);
    await vi.advanceTimersByTimeAsync(500);

    await assertion;
    expect(embedManyMock).toHaveBeenCalledTimes(1);
  });

  it("skips the call for empty input", async () => {
    await expect(embedTexts([])).resolves.toEqual([]);
    expect(embedManyMock).not.toHaveBeenCalled();
  });
});
