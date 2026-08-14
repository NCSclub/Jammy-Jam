/**
 * The submission window — when the doors open, when they shut, and how to say
 * that in a form field.
 *
 * No `server-only` here on purpose: the admin's editor and the server that
 * enforces the window have to agree on what "14/08 10:00" means, and the last
 * time two halves of this project each did their own date maths they disagreed
 * by an hour.
 */

/**
 * Algeria is UTC+1 all year and has been since 1981 — no DST, no exceptions.
 * That is why a fixed offset is safe here where it would be a bug anywhere
 * else: the admin types a wall-clock time in Algiers and it means exactly one
 * instant, whatever timezone the server or the browser happens to be in.
 */
export const ALGERIA_OFFSET = "+01:00";
const ALGERIA_MS = 60 * 60 * 1000;

/**
 * Three states, not two.
 *
 * "closed" was ambiguous the moment a start time existed: before the jam the
 * desk is shut AND the shelf must stay locked, after it the desk is shut and
 * the shelf is public. One boolean cannot say both.
 */
export type SubmissionPhase = "before" | "open" | "after";

export type SubmissionWindow = {
  /** true → the clock below decides; false → `closed` decides. */
  scheduled: boolean;
  /** The manual switch. Only consulted when `scheduled` is false. */
  closed: boolean;
  /** ISO instants, or null for "no bound" — before this, the desk is shut. */
  opensAt: string | null;
  /** ISO instant, or null. At this moment the desk shuts and the shelf opens. */
  closesAt: string | null;
};

/**
 * Where we are right now.
 *
 * A scheduled window with no bounds set is open — an admin who ticked
 * "scheduled" and has not filled the times in yet has not closed anything.
 */
export function resolvePhase(
  window: SubmissionWindow,
  now: Date = new Date(),
): SubmissionPhase {
  if (!window.scheduled) return window.closed ? "after" : "open";

  const at = now.getTime();
  if (window.closesAt && at >= Date.parse(window.closesAt)) return "after";
  if (window.opensAt && at < Date.parse(window.opensAt)) return "before";
  return "open";
}

/** The next boundary the clock should count down to, or null if there is none. */
export function nextBoundary(
  window: SubmissionWindow,
  now: Date = new Date(),
): string | null {
  const phase = resolvePhase(window, now);
  if (phase === "before") return window.opensAt;
  if (phase === "open") return window.scheduled ? window.closesAt : null;
  return null;
}

/**
 * ISO instant → "2026-08-14T10:00", the only format <input type="datetime-local">
 * accepts, in Algiers wall-clock time.
 */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "";
  return new Date(at + ALGERIA_MS).toISOString().slice(0, 16);
}

/** The way back: what the admin typed → the instant it names. */
export function fromLocalInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const at = Date.parse(`${trimmed}:00${ALGERIA_OFFSET}`);
  return Number.isNaN(at) ? null : new Date(at).toISOString();
}

/** "14 August 2026 at 10:00" — always Algiers, wherever it is being read. */
export function formatAlgiers(iso: string | null | undefined): string {
  if (!iso) return "—";
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "—";
  return new Date(at).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Algiers",
  });
}

/** A window is only usable if it does not shut before it opens. */
export function windowError(
  opensAt: string | null,
  closesAt: string | null,
): string | null {
  if (opensAt && closesAt && Date.parse(closesAt) <= Date.parse(opensAt)) {
    return "Submissions cannot close before they open.";
  }
  return null;
}
