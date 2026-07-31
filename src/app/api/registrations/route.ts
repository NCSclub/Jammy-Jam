import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated, UNAUTHORIZED } from "@/lib/admin-auth";
import { listParticipants } from "@/lib/registrations";

/**
 * GET  /api/registrations — the dashboard list
 * POST /api/registrations — add a walk-in by hand
 *
 * Both are admin-only. Every guarded route repeats this check on purpose:
 * an endpoint that forgets it hands the whole participant table — names,
 * emails, phone numbers — to anyone who guesses the URL.
 */

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  try {
    return NextResponse.json(await listParticipants());
  } catch (error) {
    console.error("listing registrations failed", error);
    return NextResponse.json({ error: "Could not load registrations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name?.trim() || !body?.email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  /* the modal has a single Name field, the table stores the halves apart */
  const [firstName, ...rest] = String(body.name).trim().split(/\s+/);
  const team = body.team?.trim() || null;

  const { error } = await supabaseAdmin()
    .from("registrations")
    .insert({
      first_name: firstName ?? "",
      last_name: rest.join(" "),
      email: String(body.email).trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      university: body.university?.trim() ?? "",
      level: body.level ?? "",
      /* the column has a check constraint on 'both' | '13' | '14', so an unset
         dropdown has to land as NULL rather than "" */
      attendance: body.attendance || null,
      team_name: team,
      has_team: Boolean(team),
      staying: Boolean(body.staying),
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That email is already registered" },
        { status: 409 },
      );
    }
    console.error("adding participant failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
