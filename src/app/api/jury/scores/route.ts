import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  isAdminAuthenticated,
  isJuryAuthenticated,
  UNAUTHORIZED,
} from "@/lib/admin-auth";
import { deleteAllScores, listScores, upsertScore } from "@/lib/scores";
import { listCriteria } from "@/lib/criteria";
import { MAX_COMMENT, MAX_JUDGE_NAME, readScoreSheet } from "@/lib/judging";

/**
 * GET    /api/jury/scores — every sheet, for the panels' averages
 * POST   /api/jury/scores — save (or replace) one judge's sheet for one game
 * DELETE /api/jury/scores — wipe every sheet (admin, from the criteria page)
 *
 * GET and POST are jury-guarded, which admits admins too. A judge identifies
 * themselves by name; the (submission, judge) pair is unique, so posting again
 * edits their own sheet and can never touch a colleague's. Marks are validated
 * against the LIVE criteria — each mark inside its own criterion's ceiling.
 */

export async function GET() {
  if (!(await isJuryAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  try {
    return NextResponse.json({ scores: await listScores() });
  } catch (error) {
    console.error("listing jury scores failed", error);
    return NextResponse.json(
      { error: "Could not load the scores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isJuryAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  const submissionId = String(body?.submissionId ?? "").trim();
  const judgeName = String(body?.judgeName ?? "").trim();
  const comment = String(body?.comment ?? "").trim();

  if (!submissionId) {
    return NextResponse.json({ error: "Which game is this for?" }, { status: 400 });
  }
  if (judgeName.length < 2 || judgeName.length > MAX_JUDGE_NAME) {
    return NextResponse.json({ error: "Enter your name first." }, { status: 400 });
  }
  if (comment.length > MAX_COMMENT) {
    return NextResponse.json({ error: "That comment is too long." }, { status: 400 });
  }

  /* the scheme is read fresh per save: if the head judge edited it while this
     tab sat open, the stale sheet is refused here rather than stored broken */
  let criteria;
  try {
    criteria = await listCriteria();
  } catch (error) {
    console.error("loading criteria for score save failed", error);
    return NextResponse.json(
      { error: "Could not load the criteria. Is the jury_criteria table set up?" },
      { status: 500 },
    );
  }
  if (criteria.length === 0) {
    return NextResponse.json(
      { error: "Judging is not set up yet — no criteria defined." },
      { status: 400 },
    );
  }

  const scores = readScoreSheet(body?.scores, criteria);
  if (!scores) {
    return NextResponse.json(
      {
        error:
          "The criteria changed since this page loaded. Refresh and score again.",
      },
      { status: 409 },
    );
  }

  /* the row the sheet hangs off must exist — a made-up id would otherwise
     surface as an opaque foreign-key error */
  const { data: game } = await supabaseAdmin()
    .from("game_submissions")
    .select("id")
    .eq("id", submissionId)
    .maybeSingle();

  if (!game) {
    return NextResponse.json({ error: "That game does not exist." }, { status: 404 });
  }

  try {
    const saved = await upsertScore({
      submissionId,
      judgeName,
      scores,
      comment: comment || null,
    });
    return NextResponse.json({ ok: true, score: saved });
  } catch (error) {
    console.error("saving jury score failed", error);
    return NextResponse.json(
      { error: "Could not save the score. Is the jury_scores table set up?" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  /* admin, not jury: this is the "start judging over" lever on the criteria
     page, and no shared jury password should be able to pull it */
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  try {
    await deleteAllScores();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("wiping jury scores failed", error);
    return NextResponse.json(
      { error: "Could not clear the scores." },
      { status: 500 },
    );
  }
}
