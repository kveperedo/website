import { bindings, defineConfig, triggers } from "cf/config";

const PRODUCTION = {
  hyperdrive: "e733925e7579448693ac467f43c746d2",
  rateLimitKv: "94d69b877a7144539d99db18f3a589c5",
};

const PREVIEW = {
  hyperdrive: "2a21ccdb16bd4c8798afc79a759667de",
  rateLimitKv: "22d6a87333af45d88e10b7f3989cfac8",
};

function defineWebsiteWorker(resources: typeof PRODUCTION) {
  return {
    name: "website",
    compatibilityDate: "2025-09-02",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "./src/worker.ts",
    workersDev: true,
    observability: {
      logs: {
        enabled: true,
        invocationLogs: true,
      },
    },
    env: {
      HYPERDRIVE: bindings.hyperdrive({ id: resources.hyperdrive }),
      "website-rate-limit": bindings.kv({ id: resources.rateLimitKv }),
      AI: bindings.ai({ dev: { remote: true } }),
      SESSION_SECRET: bindings.secret(),
      ADMIN_PASSWORD_HASH: bindings.secret(),
      E2E_PASSWORD: bindings.secret(),
    },
  };
}

export default defineConfig(({ isPreview }) => {
  if (isPreview) {
    return { worker: defineWebsiteWorker(PREVIEW) };
  }

  return {
    worker: {
      ...defineWebsiteWorker(PRODUCTION),
      domains: ["kevinperedo.com"],
      triggers: [triggers.scheduled({ schedule: "5 0 * * *" })],
    },
  };
});
