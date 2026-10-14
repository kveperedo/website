import { beforeEach, describe, expect, it, vi } from "vitest";

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

const SESSION_COOKIE = "app-session-v1";
const SECRET = "s".repeat(32);
const FIFTEEN_DAYS = 15 * 24 * 60 * 60;

describe("getAppSession", () => {
  beforeEach(() => {
    for (const key of Object.keys(cookies)) {
      delete cookies[key];
    }

    written.length = 0;
    env.SESSION_SECRET = SECRET;
  });

  it("rejects a SESSION_SECRET shorter than iron-session's minimum", async () => {
    env.SESSION_SECRET = "too-short";

    await expect(getAppSession()).rejects.toThrow("SESSION_SECRET must be at least 32 characters");
  });

  it("reads a request with no cookie as logged out", async () => {
    const session = await getAppSession();

    expect(session.isLoggedIn).toBeUndefined();
  });

  it("seals a session into a hardened cookie", async () => {
    const session = await getAppSession();
    session.isLoggedIn = true;
    await session.save();

    expect(written).toHaveLength(1);
    expect(written[0]?.name).toBe(SESSION_COOKIE);
    expect(written[0]?.options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      // Never conditional: a stray NODE_ENV in the build shell must not drop Secure.
      secure: true,
    });

    // Max-Age is derived from the ttl less an expiry skew, so pin the policy not the skew.
    expect(written[0]?.options.maxAge).toBeLessThanOrEqual(FIFTEEN_DAYS);
    expect(written[0]?.options.maxAge).toBeGreaterThan(FIFTEEN_DAYS - 24 * 60 * 60);
  });

  it("round-trips a saved session on a later request", async () => {
    const first = await getAppSession();
    first.isLoggedIn = true;
    await first.save();

    const second = await getAppSession();

    expect(second.isLoggedIn).toBe(true);
  });

  it("treats a cookie it cannot unseal as logged out", async () => {
    cookies[SESSION_COOKIE] = "not-a-real-seal";

    const session = await getAppSession();

    expect(session.isLoggedIn).toBeUndefined();
  });

  it("treats a cookie sealed with a rotated secret as logged out", async () => {
    const first = await getAppSession();
    first.isLoggedIn = true;
    await first.save();

    env.SESSION_SECRET = "o".repeat(32);
    const second = await getAppSession();

    expect(second.isLoggedIn).toBeUndefined();
  });

  it("expires the cookie on destroy", async () => {
    const session = await getAppSession();
    session.destroy();

    expect(written).toHaveLength(1);
    expect(written[0]?.name).toBe(SESSION_COOKIE);
    expect(written[0]?.value).toBe("");
    expect(written[0]?.options).toMatchObject({ maxAge: 0 });
  });
});
