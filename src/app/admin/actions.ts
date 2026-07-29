"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession } from "./auth";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import type { Participant } from "./types";

export type LoginState = {
  error?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword || !process.env.ADMIN_SESSION_SECRET) {
    return { error: "Admin access is not configured on this server." };
  }

  if (password !== configuredPassword) {
    return { error: "Incorrect password. Please try again." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logout() {
  await clearAdminSession();
  redirect("/admin/login");
}

const COLUMNS =
  "id, first_name, last_name, email, university, level, team_name, team_size, team_members, staying, checked_in";

export async function listParticipants(): Promise<Participant[]> {
  const { data, error } = await supabaseAdmin()
    .from("registrations")
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
    email: row.email,
    university: row.university,
    level: row.level,
    team: row.team_name,
    /* walk-ins added from the dashboard have no team_size, so fall back to
       counting the listed members plus the registrant themselves */
    teamSize:
      row.team_size ??
      (row.team_members?.length ? row.team_members.length + 1 : null),
    staying: row.staying,
    checkedIn: row.checked_in,
  }));
}

export async function setCheckedIn(id: string, checkedIn: boolean) {
  const { error } = await supabaseAdmin()
    .from("registrations")
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteParticipant(id: string) {
  const { error } = await supabaseAdmin()
    .from("registrations")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function saveParticipant(input: {
  id: string | null;
  name: string;
  email: string;
  university: string;
  level: string;
  team: string | null;
  staying: boolean;
}) {
  /* the modal has a single Name field, the table stores the halves apart */
  const [firstName, ...rest] = input.name.trim().split(/\s+/);

  const row = {
    first_name: firstName ?? "",
    last_name: rest.join(" "),
    email: input.email.trim().toLowerCase(),
    university: input.university.trim(),
    level: input.level,
    team_name: input.team,
    has_team: Boolean(input.team),
    staying: input.staying,
  };

  const db = supabaseAdmin();
  const { error } = input.id
    ? await db.from("registrations").update(row).eq("id", input.id)
    : await db.from("registrations").insert(row);

  if (error) {
    if (error.code === "23505") {
      throw new Error("That email is already registered");
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin");
}

