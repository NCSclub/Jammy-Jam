/**
 * Central site configuration.
 *
 * 👉 To change the countdown target, edit `EVENT_DATE_ISO` below.
 * Use an ISO 8601 string (with timezone offset) so the countdown is
 * consistent for every visitor regardless of their local timezone.
 */

// Example: "2026-09-15T09:00:00+01:00" -> Sept 15, 2026, 9:00 AM (UTC+1)
export const EVENT_DATE_ISO = "2026-08-06T20:00:00+01:00";

/**
 * When sign-ups shut: 6 August 2026 at 20:00 Algeria time (UTC+1, no DST).
 * The offset is written into the string on purpose — without it the cutoff
 * would land at a different local hour depending on where the server runs.
 */
export const REGISTRATION_CLOSES_AT = new Date("2026-08-06T20:00:00+01:00");

/** Called on the server, so the visitor's system clock cannot reopen sign-ups. */
export function isRegistrationOpen(now: Date = new Date()) {
  return now < REGISTRATION_CLOSES_AT;
}

/** e.g. "6 August 2026 at 20:00" — for the closed notice. */
export function formatDeadline() {
  return formatMoment(REGISTRATION_CLOSES_AT);
}

/**
 * When the public game gallery at /games unlocks.
 *
 * 👉 To open the arcade right now, set this to a date in the past.
 *
 * It is deliberately the submission deadline: while the jam is running, a team
 * that opens /games sees a countdown and a head-count, not everyone else's
 * game. The moment it passes, every entry appears at once. Judged by the
 * server clock in `isGalleryOpen()`, so nobody peeks early by moving their own.
 */
export const GALLERY_OPENS_AT = new Date("2026-08-14T20:00:00+01:00");

export function isGalleryOpen(now: Date = new Date()) {
  return now >= GALLERY_OPENS_AT;
}

/** e.g. "14 August 2026 at 20:00" — for the locked arcade notice. */
export function formatGalleryOpening() {
  return formatMoment(GALLERY_OPENS_AT);
}

function formatMoment(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Algiers",
  });
}

export const siteConfig = {
    name: "Jammy Jam",
    ctaHint: {
        prefix: "Press the ",
        highlight: "Register Now",
        suffix: " button to start",
    },
    /* the registration form's own route, not an anchor on this page */
    registerHref: "/register",
    scheduleHref: "#schedule",
    /* Every href here must match a section id on the page:
       #home (hero), #about, #schedule, #contact (the footer). */
    navLinks: [
        { label: "Home", href: "#home" },
        { label: "About", href: "#about" },
        { label: "Schedule", href: "#schedule" },
        { label: "Games", href: "/games" },
        { label: "Contact", href: "#contact" },
    ],
} as const;
