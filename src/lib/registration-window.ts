/**
 * Registration closes on 6 August at 20:00 Algeria time (UTC+1, no DST).
 * The offset is written into the string on purpose — without it the cutoff
 * would land at a different local hour depending on where the server runs.
 */
export const REGISTRATION_CLOSES_AT = new Date("2026-08-06T20:00:00+01:00");

export function isRegistrationOpen(now: Date = new Date()) {
  return now < REGISTRATION_CLOSES_AT;
}

/** e.g. "6 August 2026, 20:00" — for the closed notice. */
export function formatDeadline() {
  return REGISTRATION_CLOSES_AT.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Algiers",
  });
}
