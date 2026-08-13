import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import { listCriteria } from "@/lib/criteria";
import { getGradeOutOf } from "@/lib/event-state";
import {
  type Criterion,
  isCompleteSheet,
  judgeKey,
  type ScoreSheet,
  sheetTotal,
} from "@/lib/judging";

/**
 * The jury's marks: one row per judge per game, upserted so re-scoring
 * replaces a judge's own sheet rather than stacking a second one.
 *
 * Table DDL lives in supabase/jury-scores.sql. RLS is enabled with no
 * policies, so only the service-role key — i.e. these functions — can touch
 * it; a leaked anon key reads nothing.
 */

export type JuryScoreRow = {
  id: string;
  submission_id: string;
  judge_name: string;
  scores: ScoreSheet;
  comment: string | null;
  updated_at: string;
};

const SCORE_COLUMNS = "id, submission_id, judge_name, scores, comment, updated_at";

/** Every sheet handed in so far, newest first. */
export async function listScores(): Promise<JuryScoreRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("jury_scores")
    .select(SCORE_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as JuryScoreRow[];
}

/** Save one judge's sheet for one game — theirs to overwrite, nobody else's. */
export async function upsertScore(input: {
  submissionId: string;
  judgeName: string;
  scores: ScoreSheet;
  comment: string | null;
}): Promise<JuryScoreRow> {
  const { data, error } = await supabaseAdmin()
    .from("jury_scores")
    .upsert(
      {
        submission_id: input.submissionId,
        judge_key: judgeKey(input.judgeName),
        judge_name: input.judgeName.trim(),
        scores: input.scores,
        comment: input.comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "submission_id,judge_key" },
    )
    .select(SCORE_COLUMNS)
    .single();

  if (error) throw error;
  return data as JuryScoreRow;
}

/** Start judging over: every sheet gone, the criteria untouched. Admin only. */
export async function deleteAllScores() {
  const { error } = await supabaseAdmin()
    .from("jury_scores")
    .delete()
    .neq("submission_id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

export type LeaderboardEntry = {
  submissionId: string;
  teamName: string;
  gameTitle: string;
  /** Sheets complete under the CURRENT scheme — the only ones counted. */
  judgeCount: number;
  /** Sheets left stale by a criteria edit; their judges need to re-save. */
  staleCount: number;
  /** Mean of each counted judge's total, one decimal — the ranking number. */
  averageTotal: number;
  /** Mean per criterion id, for the breakdown bars. */
  averages: Record<string, number>;
};

/**
 * The current scheme plus every submission ranked by its judges' average
 * total. Averages, not sums, so a game three judges reached does not outscore
 * a better one only two did.
 *
 * A sheet saved under an older scheme (a criterion added since, a ceiling
 * lowered) is not silently counted with holes in it — it is set aside and
 * surfaced as `staleCount`, so the board can say "2 judges need to re-score
 * this" instead of quietly averaging apples with oranges.
 */
export async function leaderboard(): Promise<{
  criteria: Criterion[];
  /** the event's grade scale (e.g. 20); null = the criteria sum */
  gradeOutOf: number | null;
  entries: LeaderboardEntry[];
}> {
  const db = supabaseAdmin();

  const [criteria, gradeOutOf, { data: games, error: gamesError }, scores] =
    await Promise.all([
      listCriteria(),
      getGradeOutOf(),
      db.from("game_submissions").select("id, team_name, game_title"),
      listScores(),
    ]);
  if (gamesError) throw gamesError;

  const bySubmission = new Map<string, JuryScoreRow[]>();
  for (const row of scores) {
    const list = bySubmission.get(row.submission_id) ?? [];
    list.push(row);
    bySubmission.set(row.submission_id, list);
  }

  /* two decimals to match the marks judges may now type (19.65, not 19.7) */
  const round1 = (value: number) => Math.round(value * 100) / 100;

  const entries = (games ?? []).map((game) => {
    const sheets = bySubmission.get(game.id as string) ?? [];
    const counted = sheets.filter((sheet) => isCompleteSheet(sheet.scores, criteria));
    const count = counted.length;

    const averages: Record<string, number> = {};
    for (const criterion of criteria) {
      averages[criterion.id] = count
        ? round1(counted.reduce((sum, s) => sum + s.scores[criterion.id], 0) / count)
        : 0;
    }

    return {
      submissionId: game.id as string,
      teamName: game.team_name as string,
      gameTitle: game.game_title as string,
      judgeCount: count,
      staleCount: sheets.length - count,
      averageTotal: count
        ? round1(counted.reduce((sum, s) => sum + sheetTotal(s.scores, criteria), 0) / count)
        : 0,
      averages,
    };
  });

  /* ties break toward the game more judges vouched for, then alphabetically
     so the order is stable between refreshes */
  entries.sort(
    (a, b) =>
      b.averageTotal - a.averageTotal ||
      b.judgeCount - a.judgeCount ||
      a.teamName.localeCompare(b.teamName),
  );

  return { criteria, gradeOutOf, entries };
}
