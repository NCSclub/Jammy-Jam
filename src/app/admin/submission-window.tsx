"use client";

import { useEffect, useState } from "react";
import {
  formatAlgiers,
  fromLocalInput,
  resolvePhase,
  toLocalInput,
  windowError,
  type SubmissionWindow,
} from "@/lib/event-window";

/**
 * The doors.
 *
 * Two buttons, one question: can teams hand games in right now? That is what
 * gets asked at the desk fifty times a day, so it is the whole top of the
 * panel — no mode to pick first, no toggle to invert in your head. Open and
 * Closed are both spelled out, and the one you are in is lit.
 *
 * The timer underneath is folded away because it is set once, days before, and
 * then wants to be forgotten. It unfolds itself when it is armed, so a jam
 * running on a schedule never hides that fact.
 */

const MINUTE = 60 * 1000;

function countdown(target: string, from: number) {
  const left = Math.max(0, Date.parse(target) - from);
  const minutes = Math.floor(left / MINUTE);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return [
    days ? `${days}d` : null,
    days || hours ? `${hours}h` : null,
    `${minutes % 60}m`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function SubmissionWindowPanel({
  window: saved,
  onSaved,
}: {
  window: SubmissionWindow;
  /** hands the freshly saved state back so the header button re-labels */
  onSaved: (next: SubmissionWindow) => void;
}) {
  const [opens, setOpens] = useState(toLocalInput(saved.opensAt));
  const [closes, setCloses] = useState(toLocalInput(saved.closesAt));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  /* null until the browser has a clock of its own: the server rendered this
     without knowing "now", and committing to a countdown during SSR is a
     guaranteed hydration mismatch a second later */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Syncing with an external clock, not deriving state from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  /* Everything below describes what is SAVED, not what is typed into the
     boxes — an unsaved edit must never look like it already took effect.

     Only a timed window needs the clock, and only that case has to wait for
     the browser to supply one. A hand-driven jam — the common case — resolves
     during SSR, so the panel opens already saying the right thing instead of
     flashing a guess and correcting itself. */
  const phase = !saved.scheduled
    ? resolvePhase(saved)
    : now === null
      ? null
      : resolvePhase(saved, new Date(now));
  const timerDirty =
    opens !== toLocalInput(saved.opensAt) || closes !== toLocalInput(saved.closesAt);
  const typedError = windowError(fromLocalInput(opens), fromLocalInput(closes));

  async function post(payload: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/admin/arcade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Could not save");

      onSaved({
        scheduled: Boolean(body.scheduled),
        closed: Boolean(body.closed),
        opensAt: body.opensAt ?? null,
        closesAt: body.closesAt ?? null,
      });
      return true;
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : "Could not save");
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** Open or close, right now. Closing is the one that changes what the whole
      internet can see, so only that direction asks twice. */
  async function setOpen(open: boolean) {
    if (open === (phase === "open")) return;

    const armed = saved.scheduled
      ? "\n\nThis also switches the timer off — from now on the doors only move when you press these buttons."
      : "";
    if (
      !open &&
      !globalThis.confirm(
        "Close submissions?\n\nTeams can no longer hand games in, and the public shelf UNLOCKS — everyone sees everyone's games. You can reopen if this was a mistake." +
          armed,
      )
    ) {
      return;
    }
    if (open && saved.scheduled && !globalThis.confirm("Open submissions now?" + armed)) {
      return;
    }

    if (await post({ closed: !open })) {
      setNote(open ? "Submissions are open." : "Submissions are closed.");
    }
  }

  async function saveTimer(armed: boolean) {
    const opensAt = fromLocalInput(opens);
    const closesAt = fromLocalInput(closes);

    /* One bound is enough: "opens at 08:00, closes when I say" is a real way
       to run a jam. Zero bounds is not — that timer would decide nothing. */
    if (armed && !opensAt && !closesAt) {
      setNote("Fill in a time first.");
      return;
    }
    if (windowError(opensAt, closesAt)) {
      setNote(windowError(opensAt, closesAt));
      return;
    }
    /* Arming a timer that is already past its closing time shuts the jam the
       instant this saves — worth one confirm, since it throws the shelf open
       to everyone at the same moment. */
    if (
      armed &&
      closesAt &&
      Date.parse(closesAt) <= Date.now() &&
      !globalThis.confirm(
        "That closing time has already passed.\n\nSaving this closes submissions immediately and UNLOCKS the public shelf. Continue?",
      )
    ) {
      return;
    }

    if (await post({ scheduled: armed, opensAt, closesAt })) {
      setNote(armed ? "Timer on." : "Timer off.");
    }
  }

  return (
    <section className="window-panel" aria-label="Submissions">
      <div className="panel-title">
        <div>
          <p className="section-kicker">THE DOORS</p>
          <h2>◷ Submissions</h2>
        </div>
        <span className={`window-status window-status--${phase ?? "idle"}`}>
          {phase === null
            ? "Checking…"
            : phase === "open"
              ? saved.scheduled && saved.closesAt
                ? `Open — closing in ${countdown(saved.closesAt, now!)}`
                : "Open"
              : phase === "before"
                ? `Not open yet — ${countdown(saved.opensAt!, now!)} to go`
                : "Closed — the shelf is public"}
        </span>
      </div>

      {/* The whole point of the panel: two words, the live one lit. */}
      <div className="window-switch" role="group" aria-label="Submissions open or closed">
        <button
          type="button"
          className={`window-switch__btn is-open${phase === "open" ? " active" : ""}`}
          disabled={busy || phase === null}
          aria-pressed={phase === "open"}
          onClick={() => setOpen(true)}
        >
          ✓ Open
        </button>
        <button
          type="button"
          className={`window-switch__btn is-shut${phase === "after" ? " active" : ""}`}
          disabled={busy || phase === null}
          aria-pressed={phase === "after"}
          onClick={() => setOpen(false)}
        >
          ✕ Closed
        </button>
      </div>

      {/* Never guess this line. "Everyone can see everyone's games" is alarming
          to read by mistake, so an unknown phase says nothing at all. */}
      <p className="window-mode-note">
        {phase === null
          ? "Reading the timer…"
          : phase === "open"
            ? "Teams can hand games in. The public shelf is locked."
            : phase === "before"
              ? "The timer has not opened the doors yet. Press Open to start early."
              : "Teams are refused, and everyone can see everyone's games."}
      </p>

      {/* Folded by default, open whenever it is armed — a jam running on a
          timer must never look like a jam running by hand. */}
      <details className="window-timer" open={saved.scheduled}>
        <summary>
          ◷ Move them automatically at a set time
          {saved.scheduled ? <span className="window-timer__on">ON</span> : null}
        </summary>

        <div className="window-fields">
          <label>
            Open at
            <input
              type="datetime-local"
              value={opens}
              onChange={(event) => setOpens(event.target.value)}
            />
            <small>{opens ? formatAlgiers(fromLocalInput(opens)) : "Leave empty — open it by hand"}</small>
          </label>
          <label>
            Close at
            <input
              type="datetime-local"
              value={closes}
              onChange={(event) => setCloses(event.target.value)}
            />
            <small>{closes ? formatAlgiers(fromLocalInput(closes)) : "Leave empty — close it by hand"}</small>
          </label>
        </div>

        <p className="window-tz">
          Algeria time (UTC+1). Closing also unlocks the public shelf — the two
          are one moment.
        </p>

        {typedError ? <p className="window-note is-bad">{typedError}</p> : null}

        <div className="window-actions">
          <button
            className="primary-button"
            disabled={busy || Boolean(typedError) || (saved.scheduled && !timerDirty)}
            onClick={() => saveTimer(true)}
          >
            {busy ? "Saving…" : saved.scheduled ? "Save changes" : "Turn timer on"}
          </button>
          {saved.scheduled ? (
            <button className="ghost-button" disabled={busy} onClick={() => saveTimer(false)}>
              Turn timer off
            </button>
          ) : null}
        </div>
      </details>

      {note ? (
        <p className={`window-note${note.startsWith("Could not") || note === "Fill in a time first." ? " is-bad" : ""}`}>
          {note}
        </p>
      ) : null}
    </section>
  );
}
