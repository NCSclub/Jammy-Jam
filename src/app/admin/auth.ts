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
    path: "/admin",
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
