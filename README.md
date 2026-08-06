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
`/admin` for the dashboard.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Environment

Create `.env.local`:

```bash
ADMIN_PASSWORD=use-a-strong-event-password
ADMIN_SESSION_SECRET=use-a-long-random-secret
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
```

The Supabase keys are server-only on purpose — no `NEXT_PUBLIC_` prefix. The
service-role key bypasses row-level security, so it must never reach the
browser. Every query runs through a server action.

## Registration

The hero's REGISTER NOW opens the form in a modal over the site; `/register` is
the same form as a standalone page. Both write to the `registrations` table in
Supabase. Sign-ups close automatically at the deadline in
`src/lib/registration-window.ts`, judged by the server clock — after which both
show a "registrations closed" panel, and the server action refuses the insert.

## Admin dashboard

`/admin` is password-gated (`ADMIN_PASSWORD`). It lists live registrations with
search, team-size filters, check-in, editing, deletion and a full CSV export.

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
