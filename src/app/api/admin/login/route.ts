import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSession } from "@/lib/admin-auth";

/** POST /api/admin/login — swaps the password for the session cookie. */
export async function POST(request: Request) {
  /* Trimmed on both sides. Env values pick up stray whitespace constantly —
     a leading space in .env.local, a trailing newline from pasting into a
     dashboard field — and an exact comparison then rejects the right password
     with no way to see why. Nobody wants a password that depends on an
     invisible character, so both sides lose theirs. */
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "Admin password is not configured." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "").trim();

  /* compare as fixed-length buffers so a wrong password cannot be narrowed
     down by how long the answer takes */
  const given = Buffer.from(password);
  const target = Buffer.from(expected);
  const ok =
    given.length === target.length && timingSafeEqual(given, target);

  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
