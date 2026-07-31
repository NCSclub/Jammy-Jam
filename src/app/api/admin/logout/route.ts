import { NextResponse } from "next/server";
import { expiredSessionCookies } from "@/lib/admin-auth";

/** POST /api/admin/logout — expires the session cookie on every scope it could hold. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  /* append, not set: one Set-Cookie header per path */
  for (const cookie of expiredSessionCookies()) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}
