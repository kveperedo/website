import { APICallError } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z, ZodError } from "zod";

import { AIRequestTimeoutError, embedTexts, runDecisionModel } from "./server";

const { embedManyMock, runMock } = vi.hoisted(() => ({
  embedManyMock: vi.fn(),
  runMock: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  embedMany: embedManyMock,
}));

vi.mock("workers-ai-provider", () => ({
  createWorkersAI: () => Object.assign(() => ({}), { textEmbedding: () => ({}) }),
}));

vi.mock("@/lib/env", () => ({ getBinding: () => ({ run: runMock }) }));

const never = () => new Promise<never>(() => {});

const badRequest = () =>
  new APICallError({
    message: "Bad request",
    url: "workers-ai:binding/run",
    requestBodyValues: {},
    statusCode: 400,
  });

const AnswerSchema = z.object({
  answers: z.object({
    type: z.object({ noul: z.number() }),
    category: z.object({ choice: z.string() }),
  }),
});

const ask = (options: { timeoutMs?: number; retries?: number }) =>
  runDecisionModel(
    { state: { description: "lunch" }, questions: { type: { type: "noul", instructions: "?" } } },
    AnswerSchema,
    options,
  );

describe("runDecisionModel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    runMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("narrows the binding's untyped response through the schema", async () => {
    runMock.mockResolvedValueOnce({
      model: "clef",
      usage: { input_tokens: 12 },
      answers: { type: { noul: 0.2 }, category: { choice: "food", confidence: 0.2 } },
    });

    // The passthrough object carries fields the schema has no opinion about; the parsed one
    // must not, which is what makes the schema worth having over the binding's `unknown`.
    await expect(ask({})).resolves.toEqual({
      answers: { type: { noul: 0.2 }, category: { choice: "food" } },
    });
  });

  it("rejects a response that fails the schema", async () => {
    runMock.mockResolvedValueOnce({ answers: { type: { noul: 0.2 } } });

    await expect(ask({})).rejects.toThrow(ZodError);
  });

  it("calls the decision model with the given state and questions", async () => {
    runMock.mockResolvedValueOnce({
      answers: { type: { noul: 0.2 }, category: { choice: "food" } },
    });

    await ask({});

    expect(runMock).toHaveBeenCalledWith(
      expect.stringContaining("clef"),
      expect.objectContaining({
        model: "clef-flash",
        state: { description: "lunch" },
        questions: { type: { type: "noul", instructions: "?" } },
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("cuts off a hung call and retries it", async () => {
    runMock.mockImplementationOnce(never).mockResolvedValueOnce({
      answers: { type: { noul: 0.2 }, category: { choice: "food" } },
    });

    const result = ask({ timeoutMs: 1_000, retries: 1 });
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(result).resolves.toMatchObject({ answers: { type: { noul: 0.2 } } });
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("aborts the hung attempt so the binding can stop", async () => {
    runMock.mockImplementationOnce(never).mockResolvedValueOnce({
      answers: { type: { noul: 0.2 }, category: { choice: "food" } },
    });

    const result = ask({ timeoutMs: 1_000, retries: 1 });
    await vi.advanceTimersByTimeAsync(1_000);
    await result;

    const { signal } = runMock.mock.calls[0][2];
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(AIRequestTimeoutError);
  });

  it("does not retry binding errors, which arrive untyped and are cheap to replace", async () => {
    runMock.mockRejectedValueOnce(new Error("internal error"));

    await expect(ask({ retries: 1 })).rejects.toThrow("internal error");
    expect(runMock).toHaveBeenCalledTimes(1);
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

  it("retries provider errors the SDK marks non-retryable", async () => {
    embedManyMock
      .mockRejectedValueOnce(
        new APICallError({
          message: "Error: internal error",
          url: "workers-ai:binding/run",
          requestBodyValues: {},
          isRetryable: false,
        }),
      )
      .mockResolvedValueOnce({ embeddings: [[0.1]] });

    await expect(embedTexts(["lunch"], { retries: 1 })).resolves.toEqual([[0.1]]);
    expect(embedManyMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry 4xx provider errors", async () => {
    embedManyMock.mockRejectedValueOnce(badRequest());

    await expect(embedTexts(["lunch"], { retries: 1 })).rejects.toThrow("Bad request");
    expect(embedManyMock).toHaveBeenCalledTimes(1);
  });

  it("skips the call for empty input", async () => {
    await expect(embedTexts([])).resolves.toEqual([]);
    expect(embedManyMock).not.toHaveBeenCalled();
  });
});
