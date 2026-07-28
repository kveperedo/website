import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { serverFunctionLoggingMiddleware } from "./utils/server-function-logging.middleware";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [serverFunctionLoggingMiddleware],
  requestMiddleware: [csrfMiddleware],
}));
