import { test } from "@playwright/test";

import { seedDatabase } from "../helpers/database";

test("seed database with deterministic transactions", async ({ page }) => {
  await seedDatabase(page);
});
