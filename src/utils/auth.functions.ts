import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { getCurrentUser, login, logout } from "./auth.server";

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(getCurrentUser);

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .handler(async ({ data: password }) => login(password));

export const logoutFn = createServerFn({ method: "POST" }).handler(logout);
