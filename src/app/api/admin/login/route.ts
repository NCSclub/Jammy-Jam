import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSession, type StaffRole } from "@/lib/admin-auth";
import { createRateLimiter, requestIp } from "@/lib/rate-limit";

/**
 * POST /api/admin/login — swaps a password for the session cookie.
 *
 * Two passwords, two roles: ADMIN_PASSWORD runs everything, JURY_PASSWORD
 * (optional) only opens the jury room and the scoring routes. The response
 * carries the role so the form knows which door to walk through.
 */

/* This endpoint guards names, emails and phone numbers behind one shared
   password, so unlimited guessing is the one attack it invites. Ten wrong
   tries per address per quarter hour; a correct password clears the slate so
   staff sharing a venue IP cannot lock each other out. */
const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });

/* compare as fixed-length buffers so a wrong password cannot be narrowed
   down by how long the answer takes */
function matches(given: string, expected: string | undefined) {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  /* Trimmed on both sides. Env values pick up stray whitespace constantly —
     a leading space in .env.local, a trailing newline from pasting into a
     dashboard field — and an exact comparison then rejects the right password
     with no way to see why. Nobody wants a password that depends on an
     invisible character, so both sides lose theirs. */
  const admin = process.env.ADMIN_PASSWORD?.trim();
  const jury = process.env.JURY_PASSWORD?.trim();

  if (!admin) {
    return NextResponse.json(
      { error: "Admin password is not configured." },
      { status: 500 },
    );
  }

  const ip = requestIp(request);
  if (!limiter.hit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "").trim();

  /* Admin checked first: if the two env values are ever set to the same
     string, the stronger role wins consistently instead of at random. */
  let role: StaffRole | null = null;
  if (matches(password, admin)) role = "admin";
  else if (matches(password, jury)) role = "jury";

  if (!role) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  limiter.clear(ip);
  await createAdminSession(role);
  return NextResponse.json({ ok: true, role });
}
