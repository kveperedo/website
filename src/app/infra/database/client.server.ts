import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { getBinding } from "@/lib/env";

export type DbTransactionClient = Prisma.TransactionClient;

export function getDb(): PrismaClient {
  const { connectionString } = getBinding("HYPERDRIVE");

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 1 }),
    log: ["warn", "error"],
  });
}

/** Runs a unit of work atomically. Services use this instead of importing Prisma directly. */
export function withTransaction<T>(fn: (tx: DbTransactionClient) => Promise<T>): Promise<T> {
  return getDb().$transaction(fn);
}
