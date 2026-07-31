import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated, UNAUTHORIZED } from "@/lib/admin-auth";
import { syncTeam } from "@/lib/registrations";

/**
 * PATCH  /api/registrations/:id — partial update, admin only
 * DELETE /api/registrations/:id — remove, admin only
 *
 * PATCH takes any subset of the fields below, so the dashboard can send a
 * one-key body for a check-in toggle or the whole form for an edit.
 */

type Body = {
  checkedIn?: boolean;
  staying?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  university?: string;
  level?: string;
  attendance?: string;
  /** null clears the team, which also resyncs whoever is left behind */
  team?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const { id } = await params;
  const body: Body | null = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Malformed request" }, { status: 400 });

  const db = supabaseAdmin();
  const update: Record<string, unknown> = {};

  if (body.checkedIn !== undefined) {
    update.checked_in = body.checkedIn;
    update.checked_in_at = body.checkedIn ? new Date().toISOString() : null;
  }
  if (body.staying !== undefined) update.staying = body.staying;
  if (body.email !== undefined) update.email = body.email.trim().toLowerCase();
  if (body.phone !== undefined) update.phone = body.phone.trim() || null;
  if (body.university !== undefined) update.university = body.university.trim();
  if (body.level !== undefined) update.level = body.level;
  if (body.attendance !== undefined) update.attendance = body.attendance || null;

  if (body.name !== undefined) {
    const [firstName, ...rest] = body.name.trim().split(/\s+/);
    update.first_name = firstName ?? "";
    update.last_name = rest.join(" ");
  }

  /* Remember the team they were on before the write — if this call moves them
     off it, the members left behind still need their rosters rebuilt. */
  let previousTeam: string | null = null;
  if (body.team !== undefined) {
    const { data } = await db
      .from("registrations")
      .select("team_name")
      .eq("id", id)
      .single();
    previousTeam = (data?.team_name as string | null) ?? null;

    const next = body.team?.trim() || null;
    update.team_name = next;
    update.has_team = Boolean(next);
    if (!next) {
      update.team_size = null;
      update.team_members = [];
    }
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await db.from("registrations").update(update).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That email is already registered" },
        { status: 409 },
      );
    }
    console.error("updating registration failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.team !== undefined) {
    const next = body.team?.trim() || null;
    if (previousTeam && previousTeam !== next) await syncTeam(previousTeam);
    if (next) await syncTeam(next);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const { id } = await params;
  const db = supabaseAdmin();

  /* grab the team first: deleting a member changes the size of what remains */
  const { data } = await db
    .from("registrations")
    .select("team_name")
    .eq("id", id)
    .single();

  const { error } = await db.from("registrations").delete().eq("id", id);
  if (error) {
    console.error("deleting registration failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const team = (data?.team_name as string | null) ?? null;
  if (team) await syncTeam(team);

  return NextResponse.json({ ok: true });
}
