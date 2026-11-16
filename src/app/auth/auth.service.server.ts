import { redirect } from "@tanstack/react-router";
import bcrypt from "bcryptjs";

import { requireEnv } from "@/lib/env";

import { cacheControl } from "../infra/cache/cache-control";
import { getAppSession } from "./auth.session.server";

const DEFAULT_LOGIN_REDIRECT = "/";
const LOGIN_REDIRECT_BASE = "https://redirect.invalid";

const resolveLoginRedirect = (from?: string) => {
  if (!from) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  let url: URL;

  try {
    url = new URL(from, LOGIN_REDIRECT_BASE);
  } catch {
    return DEFAULT_LOGIN_REDIRECT;
  }

  if (
    url.origin !== LOGIN_REDIRECT_BASE ||
    url.pathname.startsWith("//") ||
    url.pathname.startsWith("/login")
  ) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

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

export const login = async (password: string, from?: string) => {
  const adminPasswordHash = requireEnv("ADMIN_PASSWORD_HASH");
  const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

  if (!passwordMatch) {
    throw new Error("Invalid password");
  }

  const session = await getAppSession();
  session.isLoggedIn = true;
  await session.save();

  throw redirect({ href: resolveLoginRedirect(from) });
};

export const logout = async () => {
  const session = await getAppSession();
  session.destroy();

  throw redirect({ to: "/login" });
};
