"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import RegistrationClosed from "./RegistrationClosed";
import RegistrationForm, { type RegistrationValues } from "./RegistrationForm";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Decided by the server clock in page.tsx — never the visitor's. */
  registrationOpen: boolean;
  deadline: string;
  onSubmit: (values: RegistrationValues) => Promise<void>;
};

/** Mirror of the hero cursor, pointing back the other way. */
function BackArrow() {
  const OUTLINE = "#010101";
  const BODY = "#ffffff";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 5 7"
      shapeRendering="crispEdges"
      className="h-[21px] w-[15px] shrink-0"
    >
      <rect x="3" y="1" width="1" height="5" fill={BODY} />
      <rect x="2" y="2" width="1" height="3" fill={BODY} />

      <rect x="4" y="0" width="1" height="7" fill={OUTLINE} />
      <rect x="3" y="0" width="1" height="1" fill={OUTLINE} />
      <rect x="2" y="1" width="1" height="1" fill={OUTLINE} />
      <rect x="1" y="2" width="1" height="1" fill={OUTLINE} />
      <rect x="0" y="3" width="2" height="1" fill={OUTLINE} />
      <rect x="1" y="4" width="1" height="1" fill={OUTLINE} />
      <rect x="2" y="5" width="1" height="1" fill={OUTLINE} />
      <rect x="3" y="6" width="1" height="1" fill={OUTLINE} />
    </svg>
  );
}

/**
 * The registration form as an overlay on the site rather than its own page, so
 * the jam never disappears behind a bare form. /register still works as a deep
 * link; this is the same form, opened in place over the hero.
 *
 * Rendered through a portal into <body> on purpose. The hero stacks its content
 * in a z-10 layer and the navbar in a z-30 one, so a modal living inside the
 * content — however high its own z-index — is trapped under the navbar: z-index
 * only ranks siblings within the same stacking context. Portalling out of the
 * hero puts the overlay above the whole page instead.
 */
export default function RegistrationModal({
  open,
  onClose,
  registrationOpen,
  deadline,
  onSubmit,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  /* Escape closes, and Tab is trapped inside the panel — same handling as the
     mobile nav, since both are modal surfaces over the hero. */
  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  /* Lock the page behind the overlay, then hand focus back to whatever opened
     it — otherwise closing drops the caret at the top of the document. */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      returnFocusRef.current?.focus();
    };
  }, [open]);

  /* `open` starts false, so this never runs during SSR where there is no body */
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-navy-dark/80 p-4 backdrop-blur-sm sm:p-8"
      /* a click that starts inside the panel and ends here must not close it,
         so this listens for the backdrop itself being the target */
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Jammy Jam registration"
        tabIndex={-1}
        className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-4 outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          className="text-pixel-outline-thin flex items-center gap-3 self-start px-1 py-2 text-sm uppercase tracking-wide transition-transform hover:-translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:text-base"
        >
          <BackArrow />
          Back
        </button>

        {registrationOpen ? (
          <RegistrationForm onClose={onClose} onSubmit={onSubmit} />
        ) : (
          <RegistrationClosed deadline={deadline} onClose={onClose} />
        )}
      </div>
    </div>,
    document.body,
  );
}
