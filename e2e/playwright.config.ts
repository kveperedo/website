import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: "./.env" });

export default defineConfig({
  testDir: ".",
  testMatch: /tests\/.*\.spec\.ts/,
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    timezoneId: "Asia/Manila",
    trace: { mode: "on-first-retry", snapshots: false, screenshots: true },
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "auth.setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "finance.empty-state",
      testMatch: /finances\.empty-state\.spec\.ts$/,
      dependencies: ["auth.setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(import.meta.dirname, ".auth", "user.json"),
      },
    },
    {
      name: "finance.seed",
      testMatch: /seed\.spec\.ts$/,
      dependencies: ["finance.empty-state"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(import.meta.dirname, ".auth", "user.json"),
      },
    },
    {
      name: "public",
      testMatch: [/home\.spec\.ts$/, /login\.spec\.ts$/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "finance.read",
      testMatch: /finances\.read\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(import.meta.dirname, ".auth", "user.json"),
      },
      dependencies: ["finance.seed"],
    },
    {
      name: "finance.mutations",
      testMatch: /finances\.mutations\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(import.meta.dirname, ".auth", "user.json"),
      },
      dependencies: ["finance.read"],
    },
    {
      name: "finance.trends",
      testMatch: /finances\.trends\.spec\.ts$/,
      dependencies: ["finance.seed"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(import.meta.dirname, ".auth", "user.json"),
      },
    },
  ],
});
