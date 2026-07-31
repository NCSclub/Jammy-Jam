/**
 * Central site configuration.
 *
 * 👉 To change the countdown target, edit `EVENT_DATE_ISO` below.
 * Use an ISO 8601 string (with timezone offset) so the countdown is
 * consistent for every visitor regardless of their local timezone.
 */

// Example: "2026-09-15T09:00:00+01:00" -> Sept 15, 2026, 9:00 AM (UTC+1)
export const EVENT_DATE_ISO = "2026-08-06T20:00:00+01:00";

export const siteConfig = {
    name: "Jammy Jam",
    ctaHint: {
        prefix: "Press the ",
        highlight: "Register Now",
        suffix: " button to start",
    },
    registerHref: "#register",
    scheduleHref: "#schedule",
    /* Every href here must match a section id on the page:
       #home (hero), #about, #schedule, #contact (the footer). */
    navLinks: [
        { label: "Home", href: "#home" },
        { label: "About", href: "#about" },
        { label: "Schedule", href: "#schedule" },
        { label: "Contact", href: "#contact" },
    ],
} as const;