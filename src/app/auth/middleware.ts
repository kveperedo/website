import { createMiddleware } from "@tanstack/react-start";

import { requireSession } from "./server";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  await requireSession();

  return next();
});
