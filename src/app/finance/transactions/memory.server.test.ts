import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/db/client";

import {
  embedTransactionDescriptions,
  findExactTransactionMemory,
  findClosestTransactionMemories,
  normalizeTransactionDescription,
  incrementTransactionMemoryUseCount,
  upsertTransactionMemories,
} from "./memory.server";

vi.mock("@/db/client", () => ({
  getDb: vi.fn(),
}));

const { embeddingsCreate } = vi.hoisted(() => ({ embeddingsCreate: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    embeddings = { create: embeddingsCreate };
  },
}));

const mockDb = (overrides: Record<string, unknown> = {}) => {
  vi.mocked(getDb).mockReturnValue({
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    transactionMemory: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    ...overrides,
  } as never);
};

describe("normalizeTransactionDescription", () => {
  it("lowercases, trims, and collapses whitespace and punctuation", () => {
    expect(normalizeTransactionDescription("  Starbucks!  ")).toBe("starbucks");
    expect(normalizeTransactionDescription("Grab  Food---Delivery")).toBe("grab food delivery");
    expect(normalizeTransactionDescription("Jollibee #123")).toBe("jollibee 123");
  });

  it("returns an empty string for punctuation-only input", () => {
    expect(normalizeTransactionDescription("!!!")).toBe("");
  });
});

describe("embedTransactionDescriptions", () => {
  beforeEach(() => {
    embeddingsCreate.mockReset();
  });

  it("returns embeddings ordered by index in a single call", async () => {
    embeddingsCreate.mockResolvedValue({
      data: [
        { index: 1, embedding: [0.2] },
        { index: 0, embedding: [0.1] },
      ],
    });

    await expect(embedTransactionDescriptions(["a", "b"])).resolves.toEqual([[0.1], [0.2]]);
    expect(embeddingsCreate).toHaveBeenCalledTimes(1);
    expect(embeddingsCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: ["a", "b"],
    });
  });

  it("skips the API call for empty input", async () => {
    await expect(embedTransactionDescriptions([])).resolves.toEqual([]);
    expect(embeddingsCreate).not.toHaveBeenCalled();
  });
});

describe("findExactTransactionMemory", () => {
  it("returns an empty map without querying for empty input", async () => {
    const findMany = vi.fn();
    mockDb({ transactionMemory: { findMany, update: vi.fn() } });

    await expect(findExactTransactionMemory([])).resolves.toEqual(new Map());
    expect(findMany).not.toHaveBeenCalled();
  });

  it("maps rows by normalized description", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "id-1",
        normalizedDescription: "starbucks",
        type: "expense",
        category: "food_drinks",
      },
    ]);
    mockDb({ transactionMemory: { findMany, update: vi.fn() } });

    const result = await findExactTransactionMemory(["starbucks", "unknown"]);

    expect(result.get("starbucks")).toEqual({
      id: "id-1",
      type: "expense",
      category: "food_drinks",
    });
    expect(result.has("unknown")).toBe(false);
  });
});

describe("findClosestTransactionMemories", () => {
  it("returns an empty array without querying for empty input", async () => {
    const queryRaw = vi.fn();
    mockDb({ $queryRaw: queryRaw });

    await expect(findClosestTransactionMemories([])).resolves.toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("returns the top match below the distance threshold per embedding", async () => {
    const queryRaw = vi.fn().mockResolvedValue([
      { ord: 0, id: "id-1", type: "expense", category: "food_drinks", distance: 0.1 },
      { ord: 1, id: "id-2", type: "income", category: null, distance: 0.05 },
    ]);
    mockDb({ $queryRaw: queryRaw });

    await expect(findClosestTransactionMemories([[0.1], [0.2]])).resolves.toEqual([
      { id: "id-1", type: "expense", category: "food_drinks", distance: 0.1 },
      { id: "id-2", type: "income", category: null, distance: 0.05 },
    ]);
  });

  it("returns null for matches that are too distant or missing", async () => {
    const queryRaw = vi
      .fn()
      .mockResolvedValue([
        { ord: 0, id: "id-1", type: "expense", category: "food_drinks", distance: 0.2 },
      ]);
    mockDb({ $queryRaw: queryRaw });

    await expect(findClosestTransactionMemories([[0.1], [0.2]])).resolves.toEqual([null, null]);
  });

  it("returns nulls when no memories exist", async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    mockDb({ $queryRaw: queryRaw });

    await expect(findClosestTransactionMemories([[0.1]])).resolves.toEqual([null]);
  });
});

describe("incrementTransactionMemoryUseCount and upsertTransactionMemories", () => {
  it("bumps usage on touch", async () => {
    const update = vi.fn().mockResolvedValue({});
    mockDb({ transactionMemory: { findMany: vi.fn(), update } });

    await incrementTransactionMemoryUseCount("id-1");
    expect(update).toHaveBeenCalledWith({
      where: { id: "id-1" },
      data: { useCount: { increment: 1 }, lastUsedAt: expect.any(Date) },
    });
  });

  it("skips the database call when there is nothing to upsert", async () => {
    const executeRaw = vi.fn();
    mockDb({ $executeRaw: executeRaw });

    await upsertTransactionMemories([]);
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("upserts one row per entry", async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);
    mockDb({ $executeRaw: executeRaw });

    await upsertTransactionMemories([
      {
        normalizedDescription: "starbucks",
        embedding: [0.1],
        type: "expense",
        category: "food_drinks",
      },
      {
        normalizedDescription: "salary",
        embedding: [0.2],
        type: "income",
        category: null,
      },
    ]);
    expect(executeRaw).toHaveBeenCalledTimes(2);
  });
});
