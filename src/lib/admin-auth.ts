import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "jammy_admin_session";
const SESSION_VALUE = "jammy-jam-admin";

/**
 * Who a session belongs to. `admin` runs the registration dashboard and the
 * jury room; `jury` only judges — a judge's cookie opens /jury and the scoring
 * routes, never the participant table.
 */
export type StaffRole = "admin" | "jury";

/**
 * Hard ceiling on a session, enforced by the server. The dashboard already ends
 * the session when it is left, and the cookie dies with the browser — this is
 * the layer neither of those can provide: a cookie that was copied off the
 * machine stops working on its own.
 */
const MAX_SESSION_MS = 2 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return secret;
}

/* The role and issue time are signed along with the marker, so neither can be
   edited — promoting "jury" to "admin" or extending the timestamp breaks the
   HMAC. */
function sign(role: StaffRole, issuedAt: number) {
  return createHmac("sha256", getSecret())
    .update(`${SESSION_VALUE}:${role}:${issuedAt}`)
    .digest("hex");
}

/** The verified role in the cookie, or null for no/expired/tampered session. */
export async function getSessionRole(): Promise<StaffRole | null> {
  if (!process.env.ADMIN_SESSION_SECRET) return null;
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [role, issuedRaw, token] = value.split(".");
  const issuedAt = Number(issuedRaw);
  if (!token || !Number.isFinite(issuedAt)) return null;
  if (role !== "admin" && role !== "jury") return null;

  /* age first, so an expired cookie never even reaches the comparison.
     A negative age means the timestamp is in the future — clock skew or a
     tampered value; either way, refuse. */
  const age = Date.now() - issuedAt;
  if (age < 0 || age > MAX_SESSION_MS) return null;

  const expected = sign(role, issuedAt);
  if (token.length !== expected.length) return null;

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    ? role
    : null;
}

/** Full access: the registration dashboard and every /api/registrations route. */
export async function isAdminAuthenticated() {
  return (await getSessionRole()) === "admin";
}

/** The jury room and the scoring routes — admins judge too. */
export async function isJuryAuthenticated() {
  return (await getSessionRole()) !== null;
}

export async function createAdminSession(role: StaffRole) {
  /* stamped with the issue time, so every login produces a different cookie
     value instead of one constant string that would work forever */
  const issuedAt = Date.now();

  (await cookies()).set(COOKIE_NAME, `${role}.${issuedAt}.${sign(role, issuedAt)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    /* No maxAge on purpose: this is a session cookie, so it dies when the
       browser closes rather than lasting 8 hours. The dashboard also ends the
       session itself the moment it is left — this is the backstop for a crash
       or a killed tab where that never runs. */
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
