import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import type { Criterion } from "@/lib/judging";

/**
 * The marking scheme, read from and written to the jury_criteria table.
 * Table DDL and the seed scheme live in supabase/jury-scores.sql.
 */

/** What the editor sends for one row: an id when the row already existed. */
export type CriterionInput = {
  id?: string;
  label: string;
  hint: string | null;
  max: number;
};

/** The scheme in display order. Empty array means judging is not set up yet. */
export async function listCriteria(): Promise<Criterion[]> {
  const { data, error } = await supabaseAdmin()
    .from("jury_criteria")
    .select("id, label, hint, max_score, position")
    .order("position", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as { id: string; label: string; hint: string | null; max_score: number }[]).map(
    (row) => ({ id: row.id, label: row.label, hint: row.hint, max: row.max_score }),
  );
}

/**
 * Replace the whole scheme with what the editor shows, in its order.
 *
 * Rows the editor kept arrive WITH their old id and are updated in place, so
 * the marks already saved against those ids stay valid; only criteria the
 * head judge actually removed orphan their marks, which is exactly what
 * removing a criterion means.
 *
 * Ordered so a failure can never empty the table: survivors are upserted
 * first, new rows inserted second, and rows removed in the editor are pruned
 * LAST. If any step dies, the worst case is leftover rows — never data loss.
 * (The original delete-then-insert wiped the scheme when the insert failed.)
 */
export async function replaceCriteria(items: CriterionInput[]): Promise<Criterion[]> {
  const db = supabaseAdmin();

  const survivors = items.filter((item) => item.id);
  const additions = items.filter((item) => !item.id);
  /* positions follow the editor's order across both groups */
  const positionOf = new Map(items.map((item, index) => [item, index]));

  const keepIds = survivors.map((item) => item.id as string);

  if (survivors.length) {
    const { error } = await db.from("jury_criteria").upsert(
      survivors.map((item) => ({
        id: item.id as string,
        label: item.label,
        hint: item.hint,
        max_score: item.max,
        position: positionOf.get(item) as number,
      })),
    );
    if (error) throw error;
  }

  if (additions.length) {
    const { data, error } = await db
      .from("jury_criteria")
      .insert(
        additions.map((item) => ({
          label: item.label,
          hint: item.hint,
          max_score: item.max,
          position: positionOf.get(item) as number,
        })),
      )
      .select("id");
    if (error) throw error;
    keepIds.push(...((data ?? []) as { id: string }[]).map((row) => row.id));
  }

  /* the route guarantees at least one criterion, so keepIds is never empty */
  const { error: pruneError } = await db
    .from("jury_criteria")
    .delete()
    .not("id", "in", `(${keepIds.join(",")})`);
  if (pruneError) throw pruneError;

  return listCriteria();
}
