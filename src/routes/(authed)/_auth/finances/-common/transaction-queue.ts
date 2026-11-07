import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "finance.transaction-queue";
const EMPTY_ENTRIES: Array<string> = [];

const QueuedEntrySchema = z.string().trim().min(1);
const QueuedEntriesSchema = z.array(QueuedEntrySchema);

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const parseEntries = (raw: string): Array<string> | null => {
  try {
    const parsed = QueuedEntriesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedEntries: Array<string> = EMPTY_ENTRIES;

const getSnapshot = (): Array<string> => {
  const storage = getStorage();
  if (!storage) {
    return EMPTY_ENTRIES;
  }

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_ENTRIES;
  }

  if (raw === cachedRaw) {
    return cachedEntries;
  }

  if (!raw) {
    cachedRaw = null;
    cachedEntries = EMPTY_ENTRIES;
    return cachedEntries;
  }

  const entries = parseEntries(raw);
  if (entries === null) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {}
    cachedRaw = null;
    cachedEntries = EMPTY_ENTRIES;
    return cachedEntries;
  }

  cachedRaw = raw;
  cachedEntries = entries;
  return cachedEntries;
};

const getServerSnapshot = (): Array<string> => EMPTY_ENTRIES;

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
};

export const useQueuedEntries = (): Array<string> =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const readQueuedEntries = (): Array<string> => getSnapshot();

export const writeQueuedEntries = (entries: Array<string>): void => {
  const storage = getStorage();
  if (storage) {
    try {
      if (entries.length === 0) {
        storage.removeItem(STORAGE_KEY);
      } else {
        storage.setItem(STORAGE_KEY, JSON.stringify(entries));
      }
    } catch {}
  }

  emit();
};

export const clearQueuedEntries = (): void => {
  writeQueuedEntries([]);
};
