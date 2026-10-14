import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  embedTransactionDescriptions,
  findClosestTransactionMemories,
  findExactTransactionMemory,
} from "./memory.server";
import { classifyTransactions } from "./server";

const { runDecisionModelMock } = vi.hoisted(() => ({ runDecisionModelMock: vi.fn() }));

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

vi.mock("@/app/ai/server", () => ({
  embedTexts: vi.fn(),
  runDecisionModel: runDecisionModelMock,
}));

vi.mock("./memory.server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./memory.server")>()),
  embedTransactionDescriptions: vi.fn(),
  findExactTransactionMemory: vi.fn(),
  findClosestTransactionMemories: vi.fn(),
  incrementTransactionMemoryUseCount: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("cloudflare:workers", () => ({ waitUntil: vi.fn() }));

/** The decision model answers type as a probability and category as a chosen option. */
const answer = (noul: number, category = "food_drinks") => ({
  answers: { type: { noul }, category: { choice: category } },
});

const lunch = { description: "jollibee", amount: 150, transactedAt: "2026-10-13" };
const salary = { description: "payroll", amount: 25_000, transactedAt: "2026-10-13" };

beforeEach(() => {
  vi.mocked(findExactTransactionMemory).mockResolvedValue(new Map());
  vi.mocked(findClosestTransactionMemories).mockResolvedValue([]);
  vi.mocked(embedTransactionDescriptions).mockReset();
  vi.mocked(embedTransactionDescriptions).mockResolvedValue([[0.1]]);
  runDecisionModelMock.mockReset();
});

describe("classifyTransactions", () => {
  it("applies an exact memory hit without embedding it or asking the model", async () => {
    vi.mocked(findExactTransactionMemory).mockResolvedValue(
      new Map([["jollibee", { id: "1", type: "expense", category: "food_drinks" }]]),
    );
    runDecisionModelMock.mockResolvedValue(answer(0.1, "financial"));

    // A remembered description is the user's own past decision, so it beats the model for free.
    // The second entry also checks each result stays attached to its own transaction.
    await expect(classifyTransactions([lunch, salary])).resolves.toEqual([
      { type: "expense", category: "food_drinks" },
      { type: "expense", category: "financial" },
    ]);
    expect(embedTransactionDescriptions).toHaveBeenCalledWith(["payroll"], expect.anything());
    expect(runDecisionModelMock).toHaveBeenCalledTimes(1);
  });

  it("applies a nearest-neighbour hit over the decision model", async () => {
    vi.mocked(findClosestTransactionMemories).mockResolvedValue([
      { id: "1", type: "expense", category: "transportation", distance: 0.02 },
    ]);
    runDecisionModelMock.mockResolvedValue(answer(0.1, "hobbies_lifestyle"));

    await expect(classifyTransactions([lunch])).resolves.toEqual([
      { type: "expense", category: "transportation" },
    ]);
    expect(runDecisionModelMock).not.toHaveBeenCalled();
  });

  it("falls through to the decision model when memory misses", async () => {
    runDecisionModelMock.mockResolvedValue(answer(0.1));

    await expect(classifyTransactions([lunch])).resolves.toEqual([
      { type: "expense", category: "food_drinks" },
    ]);
    expect(runDecisionModelMock).toHaveBeenCalledTimes(1);
  });

  it("reads income off the noul probability, with the threshold counting as income", async () => {
    runDecisionModelMock.mockResolvedValueOnce(answer(0.5)).mockResolvedValueOnce(answer(0.49));

    const [atThreshold, below] = await classifyTransactions([lunch, salary]);

    expect(atThreshold.type).toBe("income");
    expect(below.type).toBe("expense");
  });

  it("drops the category for income, where it would mean nothing", async () => {
    runDecisionModelMock.mockResolvedValue(answer(0.99, "food_drinks"));

    const [result] = await classifyTransactions([lunch]);

    expect(result).toEqual({ type: "income", category: null });
  });

  it("falls back to an uncategorised expense when the decision model fails", async () => {
    runDecisionModelMock.mockRejectedValue(new Error("internal error"));

    await expect(classifyTransactions([lunch])).resolves.toEqual([
      { type: "expense", category: null },
    ]);
  });

  it.each([
    ["the exact-match query", findExactTransactionMemory, "db down"],
    ["the embedding call", embedTransactionDescriptions, "embedding down"],
  ])("still classifies when %s fails", async (_label, dependency, message) => {
    vi.mocked(dependency as typeof findExactTransactionMemory).mockRejectedValue(
      new Error(message),
    );
    runDecisionModelMock.mockResolvedValue(answer(0.1));

    await expect(classifyTransactions([lunch])).resolves.toEqual([
      { type: "expense", category: "food_drinks" },
    ]);
    expect(runDecisionModelMock).toHaveBeenCalledTimes(1);
  });

  it("skips the model for a description that normalises away to nothing", async () => {
    // Nothing to embed and nothing meaningful to ask about, so there is no point paying for it.
    await expect(classifyTransactions([{ ...lunch, description: "!!!" }])).resolves.toEqual([
      { type: "expense", category: null },
    ]);
    expect(runDecisionModelMock).not.toHaveBeenCalled();
  });
});
