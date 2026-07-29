import { redirect } from "@tanstack/react-router";
import { useSession } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";

import { requireEnv } from "@/lib/env";

import { cacheControl } from "./cache-control";

type SessionData = {
  isLoggedIn: boolean;
};

const useAppSession = () => {
  const password = requireEnv("SESSION_SECRET");
  return useSession<SessionData>({
    name: "app-session",
    password,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60, // 15 days
    },
  });
};

export const requireSession = async () => {
  const session = await useAppSession();

  if (!session.data.isLoggedIn) {
    throw redirect({
      to: "/login",
      headers: await cacheControl("no-store"),
    });
  }

  return session;
};

export const getCurrentUser = async () => {
  const session = await useAppSession();

  if (!session.data.isLoggedIn) {
    return false;
  }

  return session.data.isLoggedIn;
};

export const login = async (password: string) => {
  const ADMIN_PASSWORD_HASH = requireEnv("ADMIN_PASSWORD_HASH");
  const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (!passwordMatch) {
    throw new Error("Invalid password");
  }

  const session = await useAppSession();
  await session.update({ isLoggedIn: true });

  throw redirect({ to: "/finances" });
};

export const logout = async () => {
  const session = await useAppSession();
  await session.clear();

  throw redirect({ to: "/login" });
};
