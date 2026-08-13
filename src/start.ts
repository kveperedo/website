import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { serverFunctionLoggingMiddleware } from "./app/infra/logging.middleware";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [serverFunctionLoggingMiddleware],
  requestMiddleware: [csrfMiddleware],
}));
