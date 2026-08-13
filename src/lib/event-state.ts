import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import { isGalleryOpen } from "@/config/site";

/**
 * Whether submissions are open is a decision, not a clock.
 *
 * The single row in `event_state` (supabase/event-state.sql) is the source of
 * truth, flipped by the admin dashboard's "Close submissions" button — a jam
 * deadline slips, and an organizer on stage beats an editor over a config
 * file. The countdown on /games still shows the PLANNED deadline; this is
 * what actually decides.
 *
 * One flag drives both doors on purpose: the moment submissions close, the
 * shelf unlocks. They were one moment when the clock decided, and splitting
 * them now would open a window where teams can neither submit nor look.
 */

/** Has the admin closed the doors? */
export async function isSubmissionsClosed(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("event_state")
      .select("submissions_closed")
      .eq("id", true)
      .maybeSingle();

    if (error) throw error;
    if (data) return Boolean(data.submissions_closed);
  } catch {
    /* fall through to the clock */
  }

  /* Safety net: if event-state.sql has not been run (or the DB is briefly
     unreachable), fall back to the planned deadline so the site still behaves
     sensibly instead of, e.g., accepting builds forever. */
  return isGalleryOpen();
}

/** The one switch: true closes submissions and unlocks the shelf. */
export async function setSubmissionsClosed(closed: boolean) {
  const { error } = await supabaseAdmin()
    .from("event_state")
    .upsert({ id: true, submissions_closed: closed, updated_at: new Date().toISOString() });

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
 * May this request see the games themselves? Normally the same question as
 * `isSubmissionsClosed()`. ARCADE_UNLOCKED=1 in .env.local is the local
 * escape hatch: it fills the shelf with real cards for development while the
 * front page keeps its clock and submit button. Server environment only, so
 * no visitor can flip it.
 */
export async function canSeeGames(): Promise<boolean> {
  if (process.env.ARCADE_UNLOCKED === "1") return true;
  return isSubmissionsClosed();
}
