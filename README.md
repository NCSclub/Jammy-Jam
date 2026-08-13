# Jammy Jam

Official event website, registration form and admin dashboard for Jammy Jam.

Next.js (App Router) + TypeScript + Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site,
`/links` for the social link hub, `/register` for the registration form,
`/submit` for the game submission form, `/admin` for the dashboard.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Environment

Create `.env.local`:

```bash
ADMIN_PASSWORD=use-a-strong-event-password
# optional: a second password that only opens the jury room + scoring,
# so judges never get delete access to the registration table
JURY_PASSWORD=a-different-password-for-judges
ADMIN_SESSION_SECRET=use-a-long-random-secret
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

The Supabase keys are server-only on purpose — no `NEXT_PUBLIC_` prefix. The
service-role key bypasses row-level security, so it must never reach the
browser. Every query runs through a server action.

## Closing submissions / opening the arcade

Submissions do not close on a clock — an admin closes them. The dashboard's
arcade switch (top right of `/admin`) does both halves at once: teams can no
longer hand builds in, and the public shelf at `/games/shelf` unlocks so
everyone sees everyone's games. It is reversible, and always asks before
flipping. The countdown on `/games` shows the *planned* deadline
(`GALLERY_OPENS_AT` in `src/config/site.ts`) but decides nothing.

Run `supabase/event-state.sql` once to create the switch's table. Until it
exists, the site falls back to the planned deadline.

## Registration

The hero's REGISTER NOW opens the form in a modal over the site; `/register` is
the same form as a standalone page. Both write to the `registrations` table in
Supabase. Sign-ups close automatically at the deadline in
`src/lib/registration-window.ts`, judged by the server clock — after which both
show a "registrations closed" panel, and the server action refuses the insert.

## Admin dashboard

`/admin` is password-gated (`ADMIN_PASSWORD`). It lists live registrations with
search, team-size filters, check-in, editing, deletion and a full CSV export.

Login is rate limited (10 tries per IP per 15 minutes) and the session cookie
carries a signed role: the admin password opens everything, the jury password
only the jury room.

## Jury room, scoring and leaderboard

The marking scheme is data, not code: `/jury/criteria` (admin password) is
where the head judge defines the criteria before scoring starts — each one's
name, a one-line description, and what it is marked out of ("Presentation" out
of 20, "Gameplay" out of 10…). Add, remove, rename, rescale and reorder
freely; saving applies to the whole jury room at once. The SQL seed ships a
five-criterion starter scheme so the room works out of the box.

`/jury` (admin or jury password) lists every submitted build with its
attachments, plus a score panel per game built from those criteria, with a
private comment. Judges type their name once at the top; one sheet per judge
per game, saving again updates their own sheet. If criteria change after
sheets were saved, stale sheets drop off the averages until their judge
re-saves — or the admin wipes all sheets from the criteria page and judging
starts fresh.

`/jury/leaderboard` ranks teams by the average of their judges' totals, with a
podium, per-criterion breakdown bars, and a list of games still waiting for
marks. Staff-only — winners are announced on stage, not by URL.

Before first use, run `supabase/jury-scores.sql` in the Supabase SQL editor to
create the `jury_criteria` and `jury_scores` tables.

## Countdown

The hero countdown target lives in `src/config/site.ts`:

```ts
export const EVENT_DATE_ISO = "2026-09-15T09:00:00+01:00";
```

Use an ISO 8601 string with a timezone offset so every visitor sees the same
target moment. Nav links and CTA copy are in the same file.

## Structure

```
src/app/
  layout.tsx          Root layout, loads the pixel display font
  page.tsx            Page composition: hero, digits, schedule, sponsors, footer
  globals.css         Design tokens, font-face, pixel utility classes
  links/              Public Jammy Jam social link hub
  register/           Public registration form + server action
  submit/             Game submission form (build upload -> Supabase storage)
  admin/              Password-gated dashboard, auth and server actions
src/components/
  Navbar.tsx          Responsive nav, focus-trapped mobile dialog
  CloudField.tsx      Decorative background clouds (aria-hidden)
  Countdown.tsx       Client component, ticks every second, aria-live
  HeroActions.tsx     Register / Schedule buttons
  PillButton.tsx      Reusable pixel-styled button
  sections/           Digits, event schedule, sponsors
  layout/Footer.tsx   Site footer
  registration/       The registration form and its pixel styling
src/lib/              Supabase client, registration window
src/config/site.ts    Countdown date, nav links, CTA copy
```

## Accessibility notes

- Mobile menu: `aria-expanded` on the toggle, `role="dialog"` +
  `aria-modal="true"` on the panel, focus trapped inside, `Escape` closes and
  returns focus, body scroll locked while open.
- Countdown uses `role="timer"` and `aria-live="polite"` so screen readers get
  a summary rather than a tick-by-tick readout.
- Decorative art is `aria-hidden`; the logo has descriptive alt text.
- `prefers-reduced-motion` is respected throughout.
