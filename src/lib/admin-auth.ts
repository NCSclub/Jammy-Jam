import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "jammy_admin_session";
const SESSION_VALUE = "jammy-jam-admin";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return secret;
}

function sessionToken() {
  return createHmac("sha256", getSecret()).update(SESSION_VALUE).digest("hex");
}

export async function isAdminAuthenticated() {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;

  const expected = sessionToken();
  if (value.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function createAdminSession() {
  (await cookies()).set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    /* Root path, not /admin. The browser only sends a cookie to paths under
       its own, so a /admin-scoped cookie never reaches /api/registrations and
       every admin request would come back 401. */
    path: "/",
  });
}

/**
 * Raw Set-Cookie values that expire the session, one per scope.
 *
 * Two of them because a cookie is identified by name AND path: sessions issued
 * before this moved to "/" are still sitting on "/admin", and expiring one
 * leaves the other behind to sign you straight back in. They are built as raw
 * strings rather than through cookies().delete() because that store is keyed by
 * name alone, so the second call silently replaces the first instead of adding
 * a second header.
 */
export function expiredSessionCookies() {
  const flags = [
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Strict",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");

  return ["/", "/admin"].map(
    (path) => `${COOKIE_NAME}=; Path=${path}; ${flags}`,
  );
}

/** 401 body every guarded route returns, so the client can branch on it. */
export const UNAUTHORIZED = { error: "Not signed in" };
