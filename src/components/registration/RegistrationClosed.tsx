import Link from "next/link";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./registration-form.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-pixel",
});

const bodyFont = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-body",
});

/**
 * Shown in place of the form once the deadline has passed.
 *
 * `onClose` arrives when this is opened over the site — then it gets the same X
 * and Close buttons the form has, so the overlay is never a dead end. On the
 * standalone /register page there is nothing to close, so it offers a way back
 * to the site instead.
 */
export default function RegistrationClosed({
  onClose,
}: {
  onClose?: () => void;
}) {
  return (
    <div
      className={`jj-form ${pixelFont.variable} ${bodyFont.variable} w-full max-w-xl`}
    >
      <div className="jj-frame jj-cut p-1">
        <div className="jj-frame__bevel jj-cut p-1">
          <div className="jj-frame__body jj-cut">
            <header className="jj-header px-6 py-9 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <h2 className="jj-title text-base sm:text-xl">
                  Registrations
                  <br />
                  <em>Closed</em>
                </h2>
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="jj-close jj-cut jj-cut--sm shrink-0"
                    aria-label="Close"
                  >
                    X
                  </button>
                ) : null}
              </div>
            </header>

            <div className="jj-checker" aria-hidden="true" />

            <div className="px-6 py-12 text-center sm:px-8">
              <div className="flex flex-col items-center gap-6">
                <span className="jj-done__coin" aria-hidden="true" />
                <p className="jj-done text-sm sm:text-base">
                  Registrations are closed
                </p>
                <p className="jj-hint max-w-sm">
                  See you at the next event!
                </p>
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="jj-btn jj-cut jj-cut--sm mt-2"
                  >
                    Close
                  </button>
                ) : (
                  <Link href="/" className="jj-btn jj-cut jj-cut--sm mt-2">
                    Back to the site
                  </Link>
                )}
              </div>
            </div>

            <div className="jj-checker" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
