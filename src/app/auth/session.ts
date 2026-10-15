import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getIronSession } from "iron-session";

import { requireEnv } from "@/lib/env";

// `login` re-seals whatever the inbound cookie held, so every field must be valid logged in.
type SessionData = {
  isLoggedIn: boolean;
};

const SESSION_TTL_SECONDS = 15 * 24 * 60 * 60; // 15 days
const MIN_SECRET_LENGTH = 32;

const getSessionSecret = () => {
  const secret = requireEnv("SESSION_SECRET");

  // iron-session derives an AES key from this value and rejects anything shorter.
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }

  return secret;
};

export const getAppSession = async () =>
  getIronSession<SessionData>(
    { read: getCookie, write: setCookie },
    {
      // Renaming signs every live session out; bump the suffix to rotate.
      cookieName: "app-session-v1",
      password: getSessionSecret(),
      ttl: SESSION_TTL_SECONDS,
      cookieOptions: {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        // Always on. The Worker is only ever served over HTTPS, and browsers treat
        // localhost/127.0.0.1 as trustworthy so local dev still works. Do not derive
        // this from NODE_ENV: Start inlines that from the build shell, so a stray
        // NODE_ENV in CI would ship the admin cookie without Secure. A LAN IP over
        // plain http is not trustworthy, so login there silently fails to persist.
        secure: true,
      },
    },
  );
