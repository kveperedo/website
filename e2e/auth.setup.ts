import { test as setup } from "@playwright/test";
import path from "node:path";

import { loginAsAdmin } from "./helpers/auth";

const authFile = path.join(import.meta.dirname, ".auth", "user.json");

setup("authenticate", async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: authFile });
});
