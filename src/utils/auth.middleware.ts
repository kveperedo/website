import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { requireSession } from "./auth.server";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const session = await requireSession();

  if (!session.data.isLoggedIn) {
    throw redirect({ to: "/login" });
  }

  return next();
});
