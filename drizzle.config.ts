import { defineConfig } from "drizzle-kit";
import "dotenv/config";

import { requireEnv } from "./src/lib/env";

const DATABASE_URL = requireEnv("DATABASE_URL");

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
