import { redirect } from "@tanstack/react-router";
import { useSession } from "@tanstack/react-start/server";
import bcrypt from "bcrypt";

type SessionData = {
  isLoggedIn: boolean;
};

const useAppSession = () => {
  return useSession<SessionData>({
    name: "app-session",
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60, // 15 days
    },
  });
};

export const getCurrentUser = async () => {
  const session = await useAppSession();

  if (!session.data.isLoggedIn) {
    return null;
  }

  return session.data.isLoggedIn;
};

export const login = async (password: string) => {
  const passwordMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH!);

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
