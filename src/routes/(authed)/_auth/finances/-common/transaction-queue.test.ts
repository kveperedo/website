import { afterEach, describe, expect, it, vi } from "vitest";

import { clearQueuedEntries, readQueuedEntries, writeQueuedEntries } from "./transaction-queue";

const STORAGE_KEY = "finance.transaction-queue";

const createStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
};

const stubWindow = (localStorage: Storage) => {
  vi.stubGlobal("window", { localStorage });
};

describe("transaction queue storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty queue when there is no window", () => {
    expect(readQueuedEntries()).toEqual([]);
  });

  it("round-trips queued entries", () => {
    stubWindow(createStorage());

    writeQueuedEntries(["Milk 75", "Bread 40"]);

    expect(readQueuedEntries()).toEqual(["Milk 75", "Bread 40"]);
  });

  it("removes the key when the queue is emptied", () => {
    const storage = createStorage();
    stubWindow(storage);

    writeQueuedEntries(["Milk 75"]);
    writeQueuedEntries([]);

    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears queued entries", () => {
    const storage = createStorage();
    stubWindow(storage);

    writeQueuedEntries(["Milk 75"]);
    clearQueuedEntries();

    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(readQueuedEntries()).toEqual([]);
  });

  it("drops a malformed store entirely", () => {
    const storage = createStorage();
    stubWindow(storage);

    storage.setItem(STORAGE_KEY, "{not json");
    expect(readQueuedEntries()).toEqual([]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();

    storage.setItem(STORAGE_KEY, JSON.stringify({ entry: "Milk 75" }));
    expect(readQueuedEntries()).toEqual([]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("drops the whole store when any entry is invalid", () => {
    const storage = createStorage();
    stubWindow(storage);

    storage.setItem(STORAGE_KEY, JSON.stringify(["Milk 75", 42, "Bread 40"]));

    expect(readQueuedEntries()).toEqual([]);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("degrades to an empty queue when storage is unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("storage blocked");
      },
    });

    expect(readQueuedEntries()).toEqual([]);
    expect(() => writeQueuedEntries(["Milk 75"])).not.toThrow();
    expect(() => clearQueuedEntries()).not.toThrow();
  });
});
