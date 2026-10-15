import { isRedirect } from "@tanstack/react-router";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, login, logout, requireSession } from "./server";
import { getAppSession } from "./session";

const { cookies, written, env } = vi.hoisted(() => ({
  cookies: {} as Record<string, string>,
  written: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
  env: {} as Record<string, string>,
}));

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: (name: string) => cookies[name],
  setCookie: (name: string, value: string, options: Record<string, unknown>) => {
    written.push({ name, value, options });
    cookies[name] = value;
  },
}));

vi.mock("@/lib/env", () => ({
  requireEnv: (name: string) => {
    const value = env[name];

    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
  },
}));

// The real helper imports `cloudflare:workers`, which Vitest cannot load.
vi.mock("../infra/cache-control", () => ({
  cacheControl: async (value: string) => ({ "Cache-Control": value }),
}));

const SESSION_COOKIE = "app-session-v1";
const SECRET = "s".repeat(32);
const PASSWORD = "correct-horse";

const captureRedirect = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    if (isRedirect(error)) {
      return error;
    }

    throw error;
  }

  throw new Error("Expected a redirect, but the call resolved");
};

const logIn = async () => {
  // `login` writes the cookie and then always throws the /finances redirect.
  const redirect = await captureRedirect(() => login(PASSWORD));

  expect(redirect.options.to).toBe("/finances");
};

describe("login", () => {
  it("rejects a wrong password without writing a session cookie", async () => {
    await expect(login("wrong-password")).rejects.toThrow("Invalid password");

    expect(written).toEqual([]);
    expect(cookies[SESSION_COOKIE]).toBeUndefined();
    await expect(getCurrentUser()).resolves.toBe(false);
  });

  it("seals a session that a later request can read", async () => {
    await logIn();

    expect(written).toHaveLength(1);
    expect(written[0]?.name).toBe(SESSION_COOKIE);
    await expect(getCurrentUser()).resolves.toBe(true);
  });
});

describe("logout", () => {
  it("expires the session cookie and redirects to login", async () => {
    await logIn();
    written.length = 0;

    const redirect = await captureRedirect(logout);

    expect(redirect.options.to).toBe("/login");
    expect(written).toHaveLength(1);
    expect(written[0]?.name).toBe(SESSION_COOKIE);
    expect(written[0]?.value).toBe("");
    expect(written[0]?.options).toMatchObject({ maxAge: 0 });
    await expect(getCurrentUser()).resolves.toBe(false);
  });
});

describe("requireSession", () => {
  it("redirects to login without a session, uncached", async () => {
    const redirect = await captureRedirect(requireSession);

    expect(redirect.options.to).toBe("/login");
    expect(redirect.headers.get("Cache-Control")).toBe("no-store");
  });

  it("redirects to login for a cookie it cannot unseal", async () => {
    cookies[SESSION_COOKIE] = "not-a-real-seal";

    const redirect = await captureRedirect(requireSession);

    expect(redirect.options.to).toBe("/login");
  });

  it("resolves for a logged-in session", async () => {
    await logIn();

    await expect(requireSession()).resolves.toBeUndefined();
  });
});

describe("getCurrentUser", () => {
  it("is false without a session cookie", async () => {
    await expect(getCurrentUser()).resolves.toBe(false);
  });

  it("is false for a cookie sealed with a rotated secret", async () => {
    await logIn();
    env.SESSION_SECRET = "o".repeat(32);

    await expect(getCurrentUser()).resolves.toBe(false);
  });

  it("is true for a valid session cookie", async () => {
    const session = await getAppSession();
    session.isLoggedIn = true;
    await session.save();

    await expect(getCurrentUser()).resolves.toBe(true);
  });
});

beforeEach(() => {
  for (const key of Object.keys(cookies)) {
    delete cookies[key];
  }

  written.length = 0;
  env.SESSION_SECRET = SECRET;
  env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);
});
