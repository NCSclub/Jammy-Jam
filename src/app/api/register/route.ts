import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isRegistrationOpen } from "@/config/site";
import { syncTeam } from "@/lib/registrations";
import { createRateLimiter, requestIp } from "@/lib/rate-limit";
import type { RegistrationValues } from "@/components/registration/RegistrationForm";

/**
 * POST /api/register — the public sign-up endpoint.
 *
 * The only route in the app that is not behind the staff cookie, so the guards
 * live here: the deadline is judged by the server clock, a filled honeypot is
 * swallowed, and one IP gets five tries per ten minutes. The unique email
 * constraint and the honeypot cover what the in-memory limiter cannot.
 */
const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

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

  if (!limiter.hit(requestIp(request))) {
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
  const db = supabaseAdmin();

  /**
   * Teammates register one by one, each typing the team name from memory — so
   * "powerpuff", "Powerpuff" and "PowerPuff " are the same squad and have to
   * land on one row value. The first person to register sets the spelling;
   * everyone after is matched to it case-insensitively and stored under that
   * exact name, which is what makes them show up as one team rather than three.
   */
  let teamName: string | null = null;
  if (hasTeam && values.teamName.trim()) {
    const wanted = values.teamName.trim();
    /* ilike treats % and _ as wildcards, and a team name is free text —
       escape them so "100%_team" cannot match half the table */
    const pattern = wanted.replace(/[\\%_]/g, (c) => `\\${c}`);

    const { data: existing } = await db
      .from("registrations")
      .select("team_name")
      .ilike("team_name", pattern)
      .limit(1);

    teamName = (existing?.[0]?.team_name as string | undefined) ?? wanted;
  }

  const { error } = await db.from("registrations").insert({
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
    team_name: teamName,
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

  /* Rebuild the whole squad's roster now that a new member exists: everyone on
     the team gets their team_size and their list of the OTHER members refreshed,
     so the people who registered earlier immediately show the newcomer. */
  if (teamName) await syncTeam(teamName);

  return NextResponse.json({ ok: true }, { status: 201 });
}
