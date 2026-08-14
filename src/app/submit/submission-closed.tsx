import Link from "next/link";
import { Press_Start_2P, VT323 } from "next/font/google";
import { formatAlgiers } from "@/lib/event-window";
import "@/components/registration/registration-form.css";

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
 * The board a team gets instead of the form when the desk is shut.
 *
 * Two different shuts, two different messages. "Too late" and "too early" felt
 * identical to a team walking up before, and the difference is the only thing
 * they actually need: one of them should come back, the other should not.
 *
 * The same frame as RegistrationClosed, for the same reason the form borrows
 * the registration form's styling — one object in two places cannot drift.
 */
export default function SubmissionClosed({
  phase,
  opensAt,
}: {
  phase: "before" | "after";
  /** When the desk opens, if a timer says. Shown only in the "before" case. */
  opensAt: string | null;
}) {
  const early = phase === "before";

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
                  Submissions
                  <br />
                  <em>{early ? "Not Open Yet" : "Closed"}</em>
                </h2>
                <Link href="/games" className="jj-close" aria-label="Close">
                  <span aria-hidden="true">✕</span>
                </Link>
              </div>
            </header>

            <div className="jj-checker" aria-hidden="true" />

            <div className="px-6 py-12 text-center sm:px-8">
              <div className="flex flex-col items-center gap-6">
                <span className="jj-done__coin" aria-hidden="true" />
                <p className="jj-done text-sm sm:text-base">
                  {early ? "The desk is not open yet" : "Submissions are closed"}
                </p>
                <p className="jj-hint max-w-sm">
                  {early
                    ? opensAt
                      ? `Hand-in opens ${formatAlgiers(opensAt)}. Come back then and drop your build here.`
                      : "Hand-in has not started. Come back when the organizers open it."
                    : "The deadline has passed and no more builds are being taken. Every game handed in is on the shelf now — go play them."}
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={early ? "/games" : "/games/shelf"}
                    className="jj-btn jj-cut jj-cut--sm inline-flex items-center justify-center"
                  >
                    {early ? "Back to the arcade" : "See the games"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="jj-checker" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
