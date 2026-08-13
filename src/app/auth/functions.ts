import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { createRateLimitMiddleware } from "../infra/rate-limit/middleware";
import { getCurrentUser, login, logout } from "./server";

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(getCurrentUser);

export const loginFn = createServerFn({ method: "POST" })
  .middleware([createRateLimitMiddleware({ limit: 10 })])
  .inputValidator(z.string())
  .handler(async ({ data: password }) => login(password));

export const logoutFn = createServerFn({ method: "POST" })
  .middleware([createRateLimitMiddleware()])
  .handler(logout);
