"use client";

import { useEffect, useState } from "react";
import {
  type Criterion,
  MAX_CRITERIA,
  MAX_CRITERION_HINT,
  MAX_CRITERION_LABEL,
  MAX_CRITERION_SCORE,
  MAX_GRADE_SCALE,
  totalMax,
} from "@/lib/judging";

/**
 * The marking scheme as an editable list: name, one-line description, and the
 * ceiling each criterion is marked out of. Saving replaces the whole scheme in
 * the order shown — the rows themselves are the source of truth, no code.
 */

type Row = {
  /** local key for React; `id` is only present for rows that already exist */
  key: string;
  id?: string;
  label: string;
  hint: string;
  max: string; // kept as text while typing; validated on save
};

let nextKey = 0;
const freshKey = () => `new-${nextKey++}`;

/**
 * Live validation, so a bad number burns red the moment it is typed instead
 * of surviving until the save fails. Values stay as the typed string — no
 * silent rewriting of "12.4" into something else; the field just says what
 * it needs until it gets it.
 */
function maxProblem(value: string): string | null {
  const text = value.trim();
  if (text === "") return "Required";
  if (!/^\d+$/.test(text)) return "Whole number only";
  const n = Number(text);
  if (n < 1 || n > MAX_CRITERION_SCORE) return `1 to ${MAX_CRITERION_SCORE}`;
  return null;
}

function labelProblem(value: string): string | null {
  return value.trim().length < 2 ? "Name this criterion" : null;
}

/** Empty is fine — it means "grade out of the criteria sum". */
function scaleProblem(value: string): string | null {
  const text = value.trim();
  if (text === "") return null;
  if (!/^\d+$/.test(text)) return "Whole number only";
  const n = Number(text);
  if (n < 1 || n > MAX_GRADE_SCALE) return `1 to ${MAX_GRADE_SCALE}`;
  return null;
}

function toRows(criteria: Criterion[]): Row[] {
  return criteria.map((criterion) => ({
    key: criterion.id,
    id: criterion.id,
    label: criterion.label,
    hint: criterion.hint ?? "",
    max: String(criterion.max),
  }));
}

export default function CriteriaEditor({
  initialCriteria,
  initialGradeOutOf,
  scoresCount,
}: {
  initialCriteria: Criterion[];
  /** null = grade out of the criteria sum */
  initialGradeOutOf: number | null;
  scoresCount: number;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initialCriteria.length
      ? toRows(initialCriteria)
      : [{ key: freshKey(), label: "", hint: "", max: "10" }],
  );
  /* kept as text while typing; "" means "use the sum" */
  const [gradeOutOf, setGradeOutOf] = useState(
    initialGradeOutOf === null ? "" : String(initialGradeOutOf),
  );
  /* what the database currently holds — edits are compared against this, so
     the unsaved-changes bar knows exactly when there is something to lose */
  const [baseline, setBaseline] = useState<{ rows: Row[]; scale: string }>(() => ({
    rows: initialCriteria.length
      ? toRows(initialCriteria)
      : [],
    scale: initialGradeOutOf === null ? "" : String(initialGradeOutOf),
  }));
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const [sheets, setSheets] = useState(scoresCount);
  const [wiping, setWiping] = useState(false);

  function patch(key: string, changes: Partial<Row>) {
    setStatus("idle");
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  }

  function move(key: string, direction: -1 | 1) {
    setStatus("idle");
    setRows((current) => {
      const index = current.findIndex((row) => row.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(key: string) {
    setStatus("idle");
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function add() {
    setStatus("idle");
    setRows((current) => [
      ...current,
      { key: freshKey(), label: "", hint: "", max: "10" },
    ]);
  }

  const preview = rows
    .map((row) => ({ id: row.key, label: row.label, hint: null, max: Number(row.max) }))
    .filter((row) => Number.isInteger(row.max) && row.max >= 1);

  /* anything red anywhere blocks the save button below */
  const hasProblems =
    rows.some((row) => labelProblem(row.label) || maxProblem(row.max)) ||
    scaleProblem(gradeOutOf) !== null;

  /* Compared by content, not tracked by hand — a change that is typed and then
     typed back is not "unsaved". `key` is local-only, so it is stripped. */
  const fingerprint = (list: Row[], scale: string) =>
    JSON.stringify([
      list.map((row) => [row.id ?? null, row.label, row.hint, row.max]),
      scale.trim(),
    ]);
  const dirty =
    fingerprint(rows, gradeOutOf) !== fingerprint(baseline.rows, baseline.scale);

  /* a refresh or closed tab with staged edits gets one browser warning —
     without this, "Remove" looked like it worked until the page reloaded */
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function discard() {
    setRows(
      baseline.rows.length
        ? baseline.rows.map((row) => ({ ...row }))
        : [{ key: freshKey(), label: "", hint: "", max: "10" }],
    );
    setGradeOutOf(baseline.scale);
    setStatus("idle");
    setError("");
  }

  /**
   * What one criterion is worth on the final grade — the criteria are
   * weights, so "out of 50" next to "out of 5" is legal and means gameplay
   * carries ten times the creativity. Spelling that out under every box is
   * what keeps a lopsided scheme a choice rather than an accident.
   */
  const sumAll = totalMax(preview);
  const scaleValue =
    gradeOutOf.trim() !== "" && !scaleProblem(gradeOutOf) ? Number(gradeOutOf) : null;

  function weightNote(rawMax: string): string | null {
    if (maxProblem(rawMax) || sumAll === 0) return null;
    const max = Number(rawMax);
    const percent = Math.round((max / sumAll) * 1000) / 10;
    if (scaleValue === null) return `= ${percent}% of the grade`;
    const points = Math.round((max / sumAll) * scaleValue * 10) / 10;
    return `= ${points}/${scaleValue} of the grade (${percent}%)`;
  }

  async function save() {
    setError("");
    setStatus("saving");
    try {
      const response = await fetch("/api/jury/criteria", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: rows.map((row) => ({
            ...(row.id ? { id: row.id } : {}),
            label: row.label,
            hint: row.hint,
            max: Number(row.max),
          })),
          gradeOutOf: gradeOutOf.trim() === "" ? null : Number(gradeOutOf),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Could not save the criteria.");

      /* re-key from the server's ids so a second save updates rather than
         recreates the rows it just made */
      const savedRows = toRows(body.criteria as Criterion[]);
      const savedScale = body.gradeOutOf === null ? "" : String(body.gradeOutOf);
      setRows(savedRows);
      setGradeOutOf(savedScale);
      setBaseline({ rows: savedRows.map((row) => ({ ...row })), scale: savedScale });
      setStatus("saved");
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Could not save the criteria.");
    }
  }

  async function wipeScores() {
    if (
      !window.confirm(
        `Delete all ${sheets} saved score sheets? Every judge starts over. This cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    setWiping(true);
    try {
      const response = await fetch("/api/jury/scores", { method: "DELETE" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Could not clear the scores.");
      setSheets(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not clear the scores.");
    } finally {
      setWiping(false);
    }
  }

  return (
    <section className="jc" aria-label="Judging criteria editor">
      <p className="jc__intro">
        This is the marking scheme every judge sees. Set each criterion&apos;s
        name, an optional one-liner so everyone marks the same thing, and what
        it is scored out of. Saving applies to the whole jury room at once.
      </p>

      {sheets > 0 ? (
        <p className="jc__warning" role="alert">
          ⚠ {sheets} score {sheets === 1 ? "sheet is" : "sheets are"} already
          saved. Adding a criterion or lowering a ceiling makes old sheets
          incomplete — they drop off the averages until their judge re-saves.
          Renaming or reordering is always safe.
        </p>
      ) : null}

      <ol className="jc__list">
        {rows.map((row, index) => (
          <li className="jc__row" key={row.key}>
            <div className="jc__order">
              <button
                type="button"
                onClick={() => move(row.key, -1)}
                disabled={index === 0}
                aria-label={`Move ${row.label || "criterion"} up`}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(row.key, 1)}
                disabled={index === rows.length - 1}
                aria-label={`Move ${row.label || "criterion"} down`}
              >
                ▼
              </button>
            </div>

            <div className="jc__fields">
              <label>
                Criterion
                <input
                  className={labelProblem(row.label) ? "is-bad" : undefined}
                  value={row.label}
                  maxLength={MAX_CRITERION_LABEL}
                  placeholder="e.g. Presentation"
                  onChange={(event) => patch(row.key, { label: event.target.value })}
                />
                {labelProblem(row.label) ? (
                  <small className="jc__bad" role="alert">{labelProblem(row.label)}</small>
                ) : null}
              </label>
              <label>
                Description <small>(optional)</small>
                <input
                  value={row.hint}
                  maxLength={MAX_CRITERION_HINT}
                  placeholder="What should judges look at?"
                  onChange={(event) => patch(row.key, { hint: event.target.value })}
                />
              </label>
            </div>

            <label className="jc__max">
              Out of
              {/* text, not number: the number widget lets "12.4" and "1e5"
                  through, hides what does not fit its box, and its spinner
                  fights the pixel font. Plain digits, validated in the open. */}
              <input
                type="text"
                inputMode="numeric"
                className={maxProblem(row.max) ? "is-bad" : undefined}
                value={row.max}
                maxLength={6}
                onChange={(event) => patch(row.key, { max: event.target.value })}
              />
              {maxProblem(row.max) ? (
                <small className="jc__bad" role="alert">{maxProblem(row.max)}</small>
              ) : weightNote(row.max) ? (
                <small className="jc__weight">{weightNote(row.max)}</small>
              ) : null}
            </label>

            <button
              type="button"
              className="jc__remove"
              onClick={() => remove(row.key)}
              disabled={rows.length === 1}
              title={rows.length === 1 ? "Keep at least one criterion" : undefined}
              aria-label={`Remove ${row.label || "criterion"}`}
            >
              ✕ Remove
            </button>
          </li>
        ))}
      </ol>

      {/* a full-width slot in the list's own shape, not a small chip lost in a
          footer — adding a criterion is a first-class action here */}
      <button
        type="button"
        className="jc__addrow"
        onClick={add}
        disabled={rows.length >= MAX_CRITERIA}
      >
        {rows.length >= MAX_CRITERIA
          ? `Maximum ${MAX_CRITERIA} criteria`
          : "+ Add a criterion"}
      </button>

      <p className="jc__total">
        criteria add up to <strong>{totalMax(preview)}</strong> points
      </p>

      {/* The scale the event grades on, independent of what the criteria sum
          to: raw totals are rescaled for display, so "out of 20" works over a
          60-point scheme without touching a single weight. */}
      <div className="jc__scale">
        <label>
          Final grade out of
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className={scaleProblem(gradeOutOf) ? "is-bad" : undefined}
            placeholder={String(totalMax(preview))}
            value={gradeOutOf}
            onChange={(event) => {
              setStatus("idle");
              setGradeOutOf(event.target.value);
            }}
          />
          {scaleProblem(gradeOutOf) ? (
            <small className="jc__bad" role="alert">{scaleProblem(gradeOutOf)}</small>
          ) : null}
        </label>
        <p>
          {scaleProblem(gradeOutOf) ? (
            <>A whole number from 1 to {MAX_GRADE_SCALE}, or leave it empty to grade out of the criteria sum.</>
          ) : gradeOutOf.trim() === "" ? (
            <>Empty — grades show out of the criteria sum ({totalMax(preview)}).</>
          ) : (
            <>
              Criteria act as weights and totals rescale onto this: the{" "}
              {totalMax(preview)} raw points show as{" "}
              <strong>
                {gradeOutOf}/{gradeOutOf}
              </strong>{" "}
              for a full sweep, {Math.round((Number(gradeOutOf) / 2) * 10) / 10}/
              {gradeOutOf} for half. Each criterion&apos;s share of the grade is
              written under its box.
            </>
          )}
        </p>
      </div>

      {error ? (
        <p className="jury-score__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="jc__actions">
        <button
          type="button"
          className="jury-download"
          disabled={status === "saving" || hasProblems}
          onClick={save}
        >
          {hasProblems
            ? "Fix the red fields first"
            : status === "saving"
              ? "Saving…"
              : status === "saved"
                ? "✓ Saved — live for every judge"
                : "Save criteria"}
        </button>
      </div>

      {/* Edits are staged until saved — this bar is what says so, everywhere
          on the page, the moment anything differs from the database. */}
      {dirty ? (
        <div className="jc__saverbar" role="status">
          <span>
            UNSAVED CHANGES — removals and edits apply only when you save
          </span>
          <div className="jc__saverbar-buttons">
            <button
              type="button"
              className="jury-download"
              disabled={status === "saving" || hasProblems}
              onClick={save}
            >
              {hasProblems ? "Fix the red fields" : status === "saving" ? "Saving…" : "Save now"}
            </button>
            <button type="button" className="jc__discard" onClick={discard}>
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {sheets > 0 ? (
        <div className="jc__danger">
          <h2>Start over</h2>
          <p>
            Changed the scheme after judging began? Wipe every saved sheet and
            have the jury score fresh against the new criteria.
          </p>
          <button type="button" onClick={wipeScores} disabled={wiping}>
            {wiping ? "Clearing…" : `Delete all ${sheets} score sheets`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
