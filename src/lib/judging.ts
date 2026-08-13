/**
 * The judging vocabulary, shared by the jury room's forms and the API routes
 * that store what they send.
 *
 * The criteria themselves are NOT defined here — they live in the
 * jury_criteria table and are edited at /jury/criteria, so the head judge can
 * rename, rescale ("Presentation" out of 20) or replace them without touching
 * code. This module only knows the shape of a criterion and how to check a
 * sheet of marks against whatever the current scheme is.
 *
 * No `server-only` here on purpose: the score panel needs the same bounds the
 * routes enforce.
 */

export type Criterion = {
  /** jury_criteria.id — the key the marks in a sheet hang off. */
  id: string;
  label: string;
  /** One line under the label, so every judge marks the same thing. */
  hint: string | null;
  /** This criterion's own ceiling: marked out of `max`. */
  max: number;
};

export const MAX_JUDGE_NAME = 40;
export const MAX_COMMENT = 600;

/* Bounds for the editor: enough room for any real scheme, tight enough that a
   typo (a 1000-point criterion, a 40-row scheme) cannot wreck the board. */
export const MAX_CRITERIA = 12;
export const MAX_CRITERION_LABEL = 60;
export const MAX_CRITERION_HINT = 140;
export const MAX_CRITERION_SCORE = 100;

/** Marks keyed by criterion id, e.g. { "<uuid>": 7, ... }. */
export type ScoreSheet = Record<string, number>;

/** The best total a game can earn under this scheme. */
export function totalMax(criteria: readonly Criterion[]) {
  return criteria.reduce((sum, criterion) => sum + criterion.max, 0);
}

/** Ceiling for the configurable final-grade scale ("out of 20", "out of 100"). */
export const MAX_GRADE_SCALE = 1000;

/**
 * A raw total, expressed on the final-grade scale.
 *
 * The criteria are weights (gameplay /10, presentation /20…); `gradeOutOf` is
 * what the event grades out of. 45 raw of a 60-point scheme on a /20 scale is
 * 15/20. Null or matching scale returns the raw total untouched, so schemes
 * that never set a scale behave exactly as before.
 */
export function scaledTotal(
  rawTotal: number,
  criteria: readonly Criterion[],
  gradeOutOf: number | null,
): { value: number; outOf: number } {
  const sum = totalMax(criteria);
  /* two decimals, not one: marks may be typed as decimals now, and a 19.65
     that displays as 19.7 looks like a different grade than the judge gave */
  const round = (value: number) => Math.round(value * 100) / 100;
  if (!gradeOutOf || sum === 0 || gradeOutOf === sum) {
    return { value: round(rawTotal), outOf: sum };
  }
  return {
    value: round((rawTotal / sum) * gradeOutOf),
    outOf: gradeOutOf,
  };
}

/**
 * "Sara ", "sara" and "SARA" are one judge. The key is what the unique
 * constraint sees, so re-scoring under a differently-cased name updates the
 * first sheet instead of quietly counting one person twice.
 */
export function judgeKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** A usable mark: any finite number inside the criterion's ceiling — decimals
    welcome, a jury that wants to hand out a 19.76575 gets to. */
export function isValidMark(mark: number, max: number) {
  return Number.isFinite(mark) && mark >= 0 && mark <= max;
}

/**
 * A full sheet for the current scheme — every criterion present, every mark a
 * finite number inside that criterion's own ceiling — or null. Extra keys are
 * dropped rather than rejected: they are marks for criteria that have since
 * been deleted, not an attack.
 */
export function readScoreSheet(
  value: unknown,
  criteria: readonly Criterion[],
): ScoreSheet | null {
  if (!value || typeof value !== "object" || criteria.length === 0) return null;
  const raw = value as Record<string, unknown>;
  const sheet: ScoreSheet = {};

  for (const criterion of criteria) {
    const mark = Number(raw[criterion.id]);
    if (!isValidMark(mark, criterion.max)) return null;
    /* stored exactly as typed — the judge's 19.76575 is the judge's 19.76575 */
    sheet[criterion.id] = mark;
  }
  return sheet;
}

/**
 * Is a STORED sheet still complete under the current scheme? Editing the
 * criteria after judging started (new criterion, lowered ceiling) leaves old
 * sheets stale — those are excluded from averages until the judge re-saves,
 * rather than counted with holes in them.
 */
export function isCompleteSheet(
  sheet: ScoreSheet,
  criteria: readonly Criterion[],
) {
  return (
    criteria.length > 0 &&
    criteria.every((criterion) =>
      isValidMark(sheet[criterion.id], criterion.max),
    )
  );
}

export function sheetTotal(sheet: ScoreSheet, criteria: readonly Criterion[]) {
  return criteria.reduce((sum, criterion) => sum + (sheet[criterion.id] ?? 0), 0);
}
