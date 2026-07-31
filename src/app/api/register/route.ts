import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isRegistrationOpen } from "@/config/site";
import type { RegistrationValues } from "@/components/registration/RegistrationForm";

/**
 * POST /api/register — the public sign-up endpoint.
 *
 * The only route in the app that is not behind the admin cookie, so the guards
 * live here: the deadline is judged by the server clock, a filled honeypot is
 * swallowed, and one IP gets five tries per ten minutes.
 */

/* Best-effort throttle. It lives in memory, so on serverless it is per
   instance rather than global — enough to stop a naive script hammering one
   endpoint, not a distributed flood. The unique email constraint and the
   honeypot do the rest. */
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const hits = new Map<string, number[]>();

function rateLimit(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (at) => now - at < RATE_LIMIT.windowMs,
  );

  if (recent.length >= RATE_LIMIT.max) return false;

  recent.push(now);
  hits.set(ip, recent);

  /* keep the map from growing forever on a long-lived instance */
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((at) => now - at < RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }
  return true;
}

export async function POST(request: Request) {
  if (!isRegistrationOpen()) {
    return NextResponse.json({ error: "Registrations are closed" }, { status: 403 });
  }

  let values: RegistrationValues;
  try {
    values = (await request.json()) as RegistrationValues;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  /* a filled honeypot means a bot: accept silently so it does not retry */
  if (values.website?.trim()) return NextResponse.json({ ok: true });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts, wait a few minutes and try again" },
      { status: 429 },
    );
  }

  const required = [
    values.firstName,
    values.lastName,
    values.email,
    values.phone,
    values.university,
    values.studentId,
    values.level,
    values.attendance,
  ];
  if (required.some((value) => !value?.trim())) {
    return NextResponse.json(
      { error: "Some required fields are missing" },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return NextResponse.json({ error: "That email looks broken" }, { status: 400 });
  }

  const hasTeam = values.hasTeam === "yes";

  const { error } = await supabaseAdmin().from("registrations").insert({
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    discord: values.discord.trim() || null,
    university: values.university.trim(),
    student_id: values.studentId.trim(),
    level: values.level,
    skills: values.skills.trim() || null,
    expectations: values.expectations.trim() || null,
    attendance: values.attendance,
    staying: values.staying === "yes",
    has_team: hasTeam,
    team_size: hasTeam && values.teamSize ? Number(values.teamSize) : null,
    team_name: hasTeam ? values.teamName.trim() : null,
    team_members: hasTeam
      ? [values.teammate1, values.teammate2, values.teammate3]
          .map((name) => name.trim())
          .filter(Boolean)
      : [],
  });

  if (error) {
    // 23505 = unique violation, i.e. this email already registered
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 },
      );
    }
    console.error("registration insert failed", error);
    return NextResponse.json(
      { error: "Could not save your registration, try again" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
