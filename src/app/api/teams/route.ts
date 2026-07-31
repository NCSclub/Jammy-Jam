import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated, UNAUTHORIZED } from "@/lib/admin-auth";
import { syncTeam } from "@/lib/registrations";

/**
 * POST  /api/teams — put people on a team (join an existing one or start one)
 * PATCH /api/teams — rename a team, moving every member with it
 *
 * Teams have no table of their own; they are a shared team_name across rows.
 * Both handlers finish with syncTeam so team_size and each member's roster of
 * the OTHER members stay true.
 */

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const teamName = String(body?.teamName ?? "").trim();
  const memberIds: string[] = body?.memberIds ?? [];

  if (!teamName) {
    return NextResponse.json({ error: "Give the team a name" }, { status: 400 });
  }
  if (!memberIds.length) {
    return NextResponse.json({ error: "Pick at least one person" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("registrations")
    .update({ team_name: teamName, has_team: true })
    .in("id", memberIds);

  if (error) {
    console.error("assigning team failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncTeam(teamName);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const from = String(body?.from ?? "").trim();
  const to = String(body?.to ?? "").trim();

  if (!from || !to) {
    return NextResponse.json({ error: "Give the team a name" }, { status: 400 });
  }
  if (from === to) return NextResponse.json({ ok: true });

  const { error } = await supabaseAdmin()
    .from("registrations")
    .update({ team_name: to })
    .eq("team_name", from);

  if (error) {
    console.error("renaming team failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncTeam(to);
  return NextResponse.json({ ok: true });
}
