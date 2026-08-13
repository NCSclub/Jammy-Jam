"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Criterion,
  isCompleteSheet,
  isValidMark,
  judgeKey,
  MAX_COMMENT,
  MAX_JUDGE_NAME,
  scaledTotal,
  type ScoreSheet,
  sheetTotal,
} from "@/lib/judging";
import type { JuryScoreRow } from "@/lib/scores";

/**
 * The judge's name, typed once at the top of the room and shared with every
 * score panel below. One shared password means the server cannot know who is
 * scoring — the name is that identity, and the unique (game, judge) pair on
 * the server is what stops two people merging or one person double-counting.
 *
 * localStorage keeps it across visits; the custom event keeps the panels in
 * sync without threading a context through the server-rendered cards.
 */
const STORAGE_KEY = "jj-judge-name";
const EVENT_NAME = "jj-judge-changed";

function readStoredJudge() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function JudgeBar() {
  const [name, setName] = useState("");

  useEffect(() => {
    // Hydrating from localStorage, which SSR cannot see.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(readStoredJudge());
  }, []);

  function update(value: string) {
    setName(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* private mode — panels still read the event below */
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
  }

  return (
    <div className="jury-judge">
      <label htmlFor="judge-name">Judging as</label>
      <input
        id="judge-name"
        value={name}
        maxLength={MAX_JUDGE_NAME}
        placeholder="Your name"
        autoComplete="name"
        onChange={(event) => update(event.target.value)}
      />
      <p>Scores are saved under this name — keep it the same all day.</p>
    </div>
  );
}

function useJudgeName() {
  const [name, setName] = useState("");

  useEffect(() => {
    // Same localStorage hydration as the bar, plus staying subscribed to it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(readStoredJudge());
    const onChange = (event: Event) =>
      setName(String((event as CustomEvent).detail ?? ""));
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
  }, []);

  return name;
}

/** A fresh sheet opens at zero. It used to open at each criterion's midpoint
    (to avoid biasing first impressions downward), but pre-filled sliders under
    a "no marks yet" header read as marks somebody already gave — phantom
    scores confused people more than a low anchor ever would. */
function emptySheet(criteria: readonly Criterion[]): ScoreSheet {
  return Object.fromEntries(criteria.map((criterion) => [criterion.id, 0]));
}

/**
 * One game's marks: the room average up top, the judge's own sheet behind a
 * fold so a card stays scannable until they actually sit down to score it.
 *
 * The criteria arrive as a prop — whatever the head judge configured at
 * /jury/criteria — so this component knows nothing about what is being judged,
 * only how to collect a mark per row.
 */
export function ScorePanel({
  submissionId,
  criteria,
  gradeOutOf,
  initialScores,
}: {
  submissionId: string;
  criteria: Criterion[];
  /** the event's grade scale (e.g. 20); null = the criteria sum */
  gradeOutOf: number | null;
  initialScores: JuryScoreRow[];
}) {
  const judge = useJudgeName();
  const [rows, setRows] = useState(initialScores);
  const [sheet, setSheet] = useState<ScoreSheet>(() => emptySheet(criteria));
  /* What each score box literally shows. Kept separate from the numeric sheet
     so "19." mid-typing survives — deriving the text from the number is what
     used to eat the decimal point as it was typed. */
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.map((criterion) => [criterion.id, "0"])),
  );
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  /* which judge's stored sheet the inputs were last filled from, so switching
     names re-prefills but ordinary typing is never overwritten */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const mine = useMemo(
    () =>
      judge.trim()
        ? rows.find((row) => judgeKey(row.judge_name) === judgeKey(judge)) ?? null
        : null,
    [rows, judge],
  );

  useEffect(() => {
    const key = judge.trim() ? judgeKey(judge) : "";
    if (key === loadedFor) return;
    // Prefilling the form from this judge's stored sheet on identity change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadedFor(key);
    /* keep their old marks where the criterion still exists; anything new or
       rescaled beyond its old mark falls back to zero */
    const base = emptySheet(criteria);
    if (mine) {
      for (const criterion of criteria) {
        const old = mine.scores[criterion.id];
        if (isValidMark(old, criterion.max)) {
          base[criterion.id] = old;
        }
      }
    }
    setSheet(base);
    setTexts(
      Object.fromEntries(
        criteria.map((criterion) => [criterion.id, String(base[criterion.id])]),
      ),
    );
    setComment(mine?.comment ?? "");
    setStatus("idle");
    setError("");
  }, [judge, mine, loadedFor, criteria]);

  /* only sheets that are complete under the current scheme count toward the
     average — half-stale marks would drag it in random directions */
  const counted = rows.filter((row) => isCompleteSheet(row.scores, criteria));
  /* raw average first, then onto the event's grade scale (e.g. /20) */
  const average = counted.length
    ? scaledTotal(
        counted.reduce((sum, row) => sum + sheetTotal(row.scores, criteria), 0) /
          counted.length,
        criteria,
        gradeOutOf,
      )
    : null;
  const mineScaled = scaledTotal(sheetTotal(sheet, criteria), criteria, gradeOutOf);

  async function save() {
    setError("");
    if (judge.trim().length < 2) {
      setError("Type your name in the “Judging as” box up top first.");
      return;
    }

    setStatus("saving");
    try {
      const response = await fetch("/api/jury/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          judgeName: judge,
          scores: sheet,
          comment,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Could not save the score.");

      const saved = body.score as JuryScoreRow;
      setRows((current) => [
        saved,
        ...current.filter((row) => judgeKey(row.judge_name) !== judgeKey(saved.judge_name)),
      ]);
      setStatus("saved");
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Could not save the score.");
    }
  }

  return (
    <div className="jury-score">
      <div className="jury-score__head">
        <span>JURY SCORE</span>
        <strong>
          {average === null ? "no marks yet" : `${average.value} / ${average.outOf}`}
        </strong>
        <em>
          {counted.length} {counted.length === 1 ? "judge" : "judges"}
        </em>
      </div>

      <details className="jury-score__fold">
        <summary>{mine ? "Edit your score" : "Score this game"}</summary>

        <div className="jury-score__form">
          {criteria.map((criterion) => (
            <label className="jury-score__row" key={criterion.id}>
              <span className="jury-score__label">
                {criterion.label}
                {criterion.hint ? <small>{criterion.hint}</small> : null}
              </span>
              <span className="jury-score__slider">
                <input
                  type="range"
                  min={0}
                  max={criterion.max}
                  step={0.5}
                  value={sheet[criterion.id] ?? 0}
                  onChange={(event) => {
                    const mark = Number(event.target.value);
                    setStatus("idle");
                    setSheet((current) => ({ ...current, [criterion.id]: mark }));
                    setTexts((current) => ({
                      ...current,
                      [criterion.id]: String(mark),
                    }));
                  }}
                />
                {/* the mark, typed: the slider is for a feel, this is for the
                    judge who means exactly 19.76575. Digits and one decimal
                    point; a value past the ceiling snaps to it, visibly. */}
                <span className="jury-score__num">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={texts[criterion.id] ?? ""}
                    aria-label={`${criterion.label} score out of ${criterion.max}`}
                    onChange={(event) => {
                      /* comma typers are decimal typers; keep digits + first dot */
                      let text = event.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
                      const dot = text.indexOf(".");
                      if (dot !== -1) {
                        text = text.slice(0, dot + 1) + text.slice(dot + 1).replace(/\./g, "");
                      }
                      let mark = text === "" || text === "." ? 0 : Number(text);
                      if (mark > criterion.max) {
                        mark = criterion.max;
                        text = String(criterion.max);
                      }
                      setStatus("idle");
                      setTexts((current) => ({ ...current, [criterion.id]: text }));
                      setSheet((current) => ({ ...current, [criterion.id]: mark }));
                    }}
                    onFocus={(event) => event.target.select()}
                    onBlur={() =>
                      /* "19." or "" settle into the number they meant */
                      setTexts((current) => ({
                        ...current,
                        [criterion.id]: String(sheet[criterion.id] ?? 0),
                      }))
                    }
                  />
                  <small>/{criterion.max}</small>
                </span>
              </span>
            </label>
          ))}

          <label className="jury-score__comment">
            Comment <small>(optional, the team never sees it)</small>
            <textarea
              rows={2}
              maxLength={MAX_COMMENT}
              value={comment}
              placeholder="One line for the deliberation…"
              onChange={(event) => {
                setStatus("idle");
                setComment(event.target.value);
              }}
            />
          </label>

          {error ? (
            <p className="jury-score__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="jury-score__actions">
            <button
              type="button"
              className="jury-download"
              disabled={status === "saving"}
              onClick={save}
            >
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                  ? "✓ Saved"
                  : mine
                    ? "Update score"
                    : "Save score"}
            </button>
            {/* "draft" until the sliders match a saved sheet, so starting
                positions can never be mistaken for marks somebody gave */}
            <span className="jury-score__total">
              {mine !== null &&
              comment === (mine.comment ?? "") &&
              criteria.every((c) => sheet[c.id] === mine.scores[c.id])
                ? "your saved score:"
                : "draft — press save:"}{" "}
              <strong>{mineScaled.value}</strong> / {mineScaled.outOf}
            </span>
          </div>
        </div>
      </details>
    </div>
  );
}
