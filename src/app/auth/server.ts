import { redirect } from "@tanstack/react-router";
import bcrypt from "bcryptjs";

import { requireEnv } from "@/lib/env";

import { cacheControl } from "../infra/cache-control";
import { getAppSession } from "./session";

export const requireSession = async () => {
  const session = await getAppSession();

  if (session.isLoggedIn !== true) {
    throw redirect({
      to: "/login",
      headers: await cacheControl("no-store"),
    });
  }
};

export const getCurrentUser = async () => {
  const session = await getAppSession();

  return session.isLoggedIn === true;
};

export const login = async (password: string) => {
  const adminPasswordHash = requireEnv("ADMIN_PASSWORD_HASH");
  const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

  if (!passwordMatch) {
    throw new Error("Invalid password");
  }

  const session = await getAppSession();
  session.isLoggedIn = true;
  await session.save();

  throw redirect({ to: "/finances" });
};

export const logout = async () => {
  const session = await getAppSession();
  session.destroy();

  throw redirect({ to: "/login" });
};
