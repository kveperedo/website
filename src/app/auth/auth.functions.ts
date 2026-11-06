import { createServerFn } from "@tanstack/react-start";

import { createRateLimitMiddleware } from "../infra/rate-limit/rate-limit.middleware";
import { LoginInputSchema } from "./auth.schema";
import { getCurrentUser, login, logout } from "./auth.service.server";

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(getCurrentUser);

export const loginFn = createServerFn({ method: "POST" })
  .middleware([createRateLimitMiddleware({ limit: 10 })])
  .validator(LoginInputSchema)
  .handler(async ({ data: password }) => login(password));

export const logoutFn = createServerFn({ method: "POST" })
  .middleware([createRateLimitMiddleware()])
  .handler(logout);
