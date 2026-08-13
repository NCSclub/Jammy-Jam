import { NextResponse } from "next/server";
import {
  isAdminAuthenticated,
  isJuryAuthenticated,
  UNAUTHORIZED,
} from "@/lib/admin-auth";
import { listCriteria, replaceCriteria, type CriterionInput } from "@/lib/criteria";
import { getGradeOutOf, setGradeOutOf } from "@/lib/event-state";
import {
  MAX_CRITERIA,
  MAX_CRITERION_HINT,
  MAX_CRITERION_LABEL,
  MAX_CRITERION_SCORE,
  MAX_GRADE_SCALE,
} from "@/lib/judging";

/**
 * GET /api/jury/criteria — the current scheme (any staff)
 * PUT /api/jury/criteria — replace it (admin only)
 *
 * PUT is the whole editor page in one call: the array IS the scheme, in
 * order. Rows that kept their id keep their saved marks; removed rows orphan
 * theirs, which is what removing a criterion means.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  if (!(await isJuryAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  try {
    return NextResponse.json({
      criteria: await listCriteria(),
      gradeOutOf: await getGradeOutOf(),
    });
  } catch (error) {
    console.error("listing jury criteria failed", error);
    return NextResponse.json(
      { error: "Could not load the criteria. Is the jury_criteria table set up?" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  /* admin, not jury: whoever can edit the scale can decide the winner */
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const raw = Array.isArray(body?.criteria) ? body.criteria : null;

  if (!raw || raw.length === 0) {
    return NextResponse.json(
      { error: "Keep at least one criterion." },
      { status: 400 },
    );
  }
  if (raw.length > MAX_CRITERIA) {
    return NextResponse.json(
      { error: `Up to ${MAX_CRITERIA} criteria.` },
      { status: 400 },
    );
  }

  const items: CriterionInput[] = [];
  for (const entry of raw) {
    const label = String(entry?.label ?? "").trim();
    const hint = String(entry?.hint ?? "").trim();
    const max = Number(entry?.max);
    const id = entry?.id === undefined ? undefined : String(entry.id);

    if (label.length < 2 || label.length > MAX_CRITERION_LABEL) {
      return NextResponse.json(
        { error: "Every criterion needs a name (2–60 characters)." },
        { status: 400 },
      );
    }
    if (hint.length > MAX_CRITERION_HINT) {
      return NextResponse.json(
        { error: `Keep descriptions under ${MAX_CRITERION_HINT} characters.` },
        { status: 400 },
      );
    }
    if (!Number.isInteger(max) || max < 1 || max > MAX_CRITERION_SCORE) {
      return NextResponse.json(
        { error: `"Out of" must be a whole number from 1 to ${MAX_CRITERION_SCORE}.` },
        { status: 400 },
      );
    }
    if (id !== undefined && !UUID.test(id)) {
      return NextResponse.json({ error: "Malformed criterion id." }, { status: 400 });
    }

    items.push({ id, label, hint: hint || null, max });
  }

  /* The final grade's scale rides along with the scheme: null (or blank) means
     "grade out of the criteria sum", a number means "rescale totals to this".
     Absent from the body entirely also means null — one shape, no surprises. */
  const rawScale = body?.gradeOutOf;
  let gradeOutOf: number | null = null;
  if (rawScale !== undefined && rawScale !== null && rawScale !== "") {
    const scale = Number(rawScale);
    if (!Number.isInteger(scale) || scale < 1 || scale > MAX_GRADE_SCALE) {
      return NextResponse.json(
        { error: `"Grade out of" must be a whole number from 1 to ${MAX_GRADE_SCALE}, or empty.` },
        { status: 400 },
      );
    }
    gradeOutOf = scale;
  }

  try {
    const criteria = await replaceCriteria(items);
    /* written only when it actually changed, so an editor save never trips
       over a missing event_state table unless the scale itself was touched */
    if (gradeOutOf !== (await getGradeOutOf())) {
      try {
        await setGradeOutOf(gradeOutOf);
      } catch (error) {
        /* the criteria saved; only the scale column is missing */
        console.error("saving grade scale failed", error);
        return NextResponse.json(
          { error: "Criteria saved, but the grade scale needs supabase/event-state.sql to be run first." },
          { status: 500 },
        );
      }
    }
    return NextResponse.json({ ok: true, criteria, gradeOutOf });
  } catch (error) {
    /* PostgREST errors can serialize to "{}" — log the useful fields by hand */
    const detail = error as { message?: string; code?: string; details?: string };
    console.error(
      "replacing jury criteria failed:",
      detail?.code,
      detail?.message,
      detail?.details,
    );
    return NextResponse.json(
      { error: "Could not save the criteria. Is the jury_criteria table set up?" },
      { status: 500 },
    );
  }
}
