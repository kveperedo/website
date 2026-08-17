import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getBinding } from "@/lib/env";

export function getDb(): PrismaClient {
  const { connectionString } = getBinding("HYPERDRIVE");

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 1 }),
    log: ["warn", "error"],
  });
}
