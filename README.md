# Jammy Jam — Landing Page

A responsive Next.js (App Router) + TypeScript + Tailwind CSS landing page
recreating the "Jammy Jam" reference design, with a live countdown and an
accessible, animated mobile navigation menu.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Change the countdown date (one place)

Edit `config/site.ts`:

```ts
export const EVENT_DATE_ISO = "2026-09-15T09:00:00+01:00";
```

Use an ISO 8601 string with a timezone offset so every visitor sees the same
target moment regardless of their local timezone. Nav links and the CTA copy
also live in this file.

## Replacing placeholder assets

This build includes generated placeholder art so the page renders correctly
out of the box. Swap in the real assets at these exact paths and everything
picks them up automatically — no code changes needed:

| Path | Purpose |
| --- | --- |
| `public/images/logo.svg` | The "JAMMY JAM" lockup with cat ears |
| `public/images/cloud.svg` | Cloud illustration, reused/positioned 4× via `components/CloudField.tsx` |
| `public/fonts/sonic-the-hedgehog-1-hud.otf` | Pixel display font referenced in `app/globals.css` |

If the font file is missing, `font-display: swap` and the fallback stack
(`"Segoe UI Black", "Arial Black", sans-serif`) keep the page fully usable.

## Structure

```
app/
  layout.tsx        Root layout + metadata
  page.tsx           Page composition (hero, countdown, anchor sections)
  globals.css        Design tokens (@theme), font-face, pixel-styled utility classes
components/
  Navbar.tsx         Responsive nav: horizontal on desktop, animated
                     hamburger + focus-trapped dialog on mobile/tablet
  CloudField.tsx      Decorative background clouds (aria-hidden)
  Countdown.tsx        Client component, ticks every second, aria-live region
  HeroActions.tsx       Client wrapper for the Register/Schedule buttons
  PillButton.tsx        Reusable pixel-styled <button>
config/
  site.ts             Countdown target date, nav links, CTA copy
```

## Accessibility notes

- Mobile menu: `aria-expanded` on the toggle, `role="dialog"` +
  `aria-modal="true"` on the panel, focus moves into the panel on open,
  `Tab`/`Shift+Tab` are trapped inside it, `Escape` closes and returns focus
  to the toggle button, and body scroll is locked while open.
- Countdown uses `role="timer"` and `aria-live="polite"` so screen readers
  get a sensible summary rather than a tick-by-tick readout.
- Decorative images (clouds) are `aria-hidden`; the logo has descriptive
  alt text.
- Respects `prefers-reduced-motion` (menu/hamburger animation duration
  drops to ~0 via Framer Motion's `useReducedMotion`, and a global CSS rule
  covers everything else).

## Responsive behavior

- Fluid, `clamp()`-free scaling is done via Tailwind responsive utilities
  (`text-xs sm:text-sm md:text-base`, `max-w-xs sm:max-w-sm md:max-w-lg`,
  etc.) rather than fixed pixel widths, so the logo, countdown tiles, and
  buttons scale smoothly from small phones up to desktop.
- Nav collapses to a hamburger below the `md` breakpoint.
