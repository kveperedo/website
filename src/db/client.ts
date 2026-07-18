import { PrismaNeonHttp } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";
import { requireEnv } from "@/lib/env";

export function getDb(): PrismaClient {
  const connectionString = requireEnv("DATABASE_URL");
  return new PrismaClient({
    adapter: new PrismaNeonHttp(connectionString, {}),
    log: ["warn", "error"],
  });
}
