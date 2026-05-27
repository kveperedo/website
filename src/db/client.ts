import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "#/generated/prisma/client";
import { requireEnv } from "#/lib/env";

const connectionString = requireEnv("DATABASE_URL");

const adapter = new PrismaNeon({ connectionString });

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const db =
  globalThis.prismaGlobal ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db;
}
