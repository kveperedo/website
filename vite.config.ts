import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vitest/config";

const isTest = process.env.VITEST === "true";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    ...(isTest
      ? []
      : [devtools(), nitro({ rollupConfig: { external: [/^@sentry\//] } }), tanstackStart()]),
    tailwindcss(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/testing/setup.ts"],
    passWithNoTests: true,
  },
});

export default config;
