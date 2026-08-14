import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import {
  GALLERY_OPENS_AT,
  isGalleryOpen,
  SUBMISSIONS_OPEN_AT,
} from "@/config/site";
import {
  resolvePhase,
  type SubmissionPhase,
  type SubmissionWindow,
} from "@/lib/event-window";

/**
 * When submissions are open is a decision the organizers make — either ahead of
 * time or on the spot.
 *
 * The single row in `event_state` (supabase/event-state.sql) is the source of
 * truth for both. `schedule_enabled` picks which one is in charge:
 *
 *   off → `submissions_closed`, the dashboard's big button. Somebody clicks,
 *         the doors move. The original behaviour, kept because an organizer on
 *         stage beats a clock that is thirty seconds out.
 *   on  → `submissions_open_at` / `submissions_close_at`. The doors move
 *         themselves at the times the admin set, which is what you want at
 *         03:00 when nobody is at a laptop.
 *
 * One flag drives both doors on purpose: the moment submissions close, the
 * shelf unlocks. Splitting them would open a window where teams can neither
 * submit nor look.
 */

/** Everything the admin set, as stored. */
export async function getSubmissionWindow(): Promise<SubmissionWindow> {
  try {
    /* select * rather than naming the columns: on a database where
       event-state.sql has not been re-run, asking for submissions_open_at by
       name is an error and the whole site falls back to the clock. This way
       the new fields are simply absent and the manual switch keeps working. */
    const { data, error } = await supabaseAdmin()
      .from("event_state")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      return {
        scheduled: Boolean(data.schedule_enabled),
        closed: Boolean(data.submissions_closed),
        opensAt: toIso(data.submissions_open_at),
        closesAt: toIso(data.submissions_close_at),
      };
    }
  } catch {
    /* fall through to the clock */
  }

  /* Safety net: if event-state.sql has not been run (or the DB is briefly
     unreachable), fall back to the planned window in src/config/site.ts so the
     site still behaves sensibly instead of, e.g., accepting builds forever.
     Expressed as a window so every caller below sees one shape.

     `scheduled` on purpose: with it off, resolvePhase reads the boolean and can
     only answer open or after, so the planned 11:00 opening would be ignored
     and an unconfigured database would take builds all morning. */
  return {
    scheduled: true,
    closed: isGalleryOpen(),
    opensAt: SUBMISSIONS_OPEN_AT.toISOString(),
    closesAt: GALLERY_OPENS_AT.toISOString(),
  };
}

/** Postgres hands timestamptz back as a string; anything else is not a time. */
function toIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : new Date(at).toISOString();
}

/** before / open / after, resolved against the server's clock — never the
    visitor's, so winding a laptop forward reopens nothing. */
export async function getSubmissionPhase(): Promise<SubmissionPhase> {
  return resolvePhase(await getSubmissionWindow());
}

/** May a team hand a game in right now? Both "not yet" and "too late" say no. */
export async function isSubmissionsClosed(): Promise<boolean> {
  return (await getSubmissionPhase()) !== "open";
}

/** The one switch: true closes submissions and unlocks the shelf. Writing it
    also stands the schedule down — clicking the button IS taking manual
    control, and a schedule that silently reversed the click a minute later
    would be the worst of both. */
export async function setSubmissionsClosed(closed: boolean) {
  const { error } = await supabaseAdmin()
    .from("event_state")
    .upsert({
      id: true,
      submissions_closed: closed,
      schedule_enabled: false,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/** Save the schedule. `scheduled: false` parks it without losing the times, so
    turning it back on does not mean typing both dates again. */
export async function setSubmissionWindow(patch: {
  scheduled: boolean;
  opensAt: string | null;
  closesAt: string | null;
}) {
  const { error } = await supabaseAdmin()
    .from("event_state")
    .upsert({
      id: true,
      schedule_enabled: patch.scheduled,
      submissions_open_at: patch.opensAt,
      submissions_close_at: patch.closesAt,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/**
 * The final grade's scale — 20 for "marked out of 20" — or null to use the
 * sum of the criteria maxima. Purely presentational: sheets store raw marks,
 * so changing the scale later rescales history instead of corrupting it.
 */
export async function getGradeOutOf(): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("event_state")
      .select("grade_out_of")
      .eq("id", true)
      .maybeSingle();

    if (error) throw error;
    const value = data?.grade_out_of;
    return typeof value === "number" && value >= 1 ? value : null;
  } catch {
    /* table or column not created yet — fall back to the criteria sum */
    return null;
  }
}

export async function setGradeOutOf(value: number | null) {
  const { error } = await supabaseAdmin()
    .from("event_state")
    .upsert({ id: true, grade_out_of: value, updated_at: new Date().toISOString() });

  if (error) throw error;
}

/**
 * May this request see the games themselves? Only once the jam is over — the
 * "after" phase, never the "before" one, which is the whole reason a phase
 * replaced the old boolean. ARCADE_UNLOCKED=1 in .env.local is the local
 * escape hatch: it fills the shelf with real cards for development while the
 * front page keeps its clock and submit button. Server environment only, so
 * no visitor can flip it.
 */
export async function canSeeGames(): Promise<boolean> {
  if (process.env.ARCADE_UNLOCKED === "1") return true;
  return (await getSubmissionPhase()) === "after";
}
