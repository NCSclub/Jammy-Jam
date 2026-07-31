import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import type { Participant } from "@/app/admin/types";

/**
 * Everything that reads or reshapes the `registrations` table lives here, so
 * the API routes stay thin and the row → view-model mapping has one home.
 */

export const LIST_COLUMNS =
  "id, first_name, last_name, email, phone, discord, university, student_id, level, skills, expectations, team_name, team_size, team_members, attendance, staying, checked_in";

type Row = Record<string, unknown>;

/** Row shape → the shape the dashboard renders. */
export function rowToParticipant(row: Row): Participant {
  const members = (row.team_members as string[] | null) ?? [];
  return {
    id: row.id as string,
    name: `${(row.first_name as string) ?? ""} ${(row.last_name as string) ?? ""}`.trim(),
    email: row.email as string,
    phone: (row.phone as string | null) ?? null,
    discord: (row.discord as string | null) ?? null,
    university: row.university as string,
    studentId: (row.student_id as string | null) ?? null,
    level: row.level as string,
    skills: (row.skills as string | null) ?? null,
    expectations: (row.expectations as string | null) ?? null,
    team: (row.team_name as string | null) ?? null,
    /* walk-ins added from the dashboard have no team_size, so fall back to
       counting the listed members plus the registrant themselves */
    teamSize:
      (row.team_size as number | null) ?? (members.length ? members.length + 1 : null),
    teamMembers: members,
    attendance: (row.attendance as string | null) ?? null,
    staying: Boolean(row.staying),
    checkedIn: Boolean(row.checked_in),
  };
}

export async function listParticipants(): Promise<Participant[]> {
  const { data, error } = await supabaseAdmin()
    .from("registrations")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToParticipant);
}

const ATTENDANCE_LABEL: Record<string, string> = {
  both: "Both days",
  "13": "13 August only",
  "14": "14 August only",
};

/** Everything in the table, not just what the cards show. */
export async function exportRows(): Promise<string[][]> {
  const { data, error } = await supabaseAdmin()
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const header = [
    "Registered at", "First name", "Last name", "Email", "Phone", "Discord",
    "University", "Student ID", "Level", "Skills", "Expectations",
    "Attendance", "Overnight", "Team", "Team size", "Team members",
    "Checked in", "Checked in at",
  ];

  const rows = (data ?? []).map((row) => [
    row.created_at ?? "",
    row.first_name ?? "",
    row.last_name ?? "",
    row.email ?? "",
    row.phone ?? "",
    row.discord ?? "",
    row.university ?? "",
    row.student_id ?? "",
    row.level ?? "",
    row.skills ?? "",
    row.expectations ?? "",
    row.attendance ? (ATTENDANCE_LABEL[row.attendance] ?? row.attendance) : "",
    row.staying ? "Yes" : "No",
    row.team_name ?? "Solo",
    row.team_size ? String(row.team_size) : "",
    (row.team_members ?? []).join(" | "),
    row.checked_in ? "Yes" : "No",
    row.checked_in_at ?? "",
  ]);

  return [header, ...rows];
}

/**
 * A team is just a shared team_name — there is no teams table — so the rows on
 * that name have to agree on how big the squad is.
 *
 * Deliberately narrow: it only ever reconciles `team_size`, and never touches
 * `team_members`. Those are the names the registrant typed on the form — their
 * claimed squad — and they are the only record of who has not signed up yet.
 * Overwriting them with the registered roster erased exactly the information
 * the dashboard needs to chase missing teammates.
 *
 * The size settles on the largest honest number: never below the head-count
 * actually registered, never below the biggest size anyone declared.
 */
export async function syncTeam(teamName: string) {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("registrations")
    .select("id, team_size")
    .eq("team_name", teamName);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  if (!rows.length) return;

  const size = Math.max(
    rows.length,
    ...rows.map((row) => (row.team_size as number | null) ?? 0),
  );

  for (const row of rows) {
    if (row.team_size === size) continue;
    const { error: writeError } = await db
      .from("registrations")
      .update({ team_size: size })
      .eq("id", row.id);

    if (writeError) throw new Error(writeError.message);
  }
}
