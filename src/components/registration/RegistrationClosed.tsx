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

/** Shown in place of the form once the deadline has passed. */
export default function RegistrationClosed({
  deadline,
}: {
  deadline: string;
}) {
  return (
    <div
      className={`jj-form ${pixelFont.variable} ${bodyFont.variable} w-full max-w-xl`}
    >
      <div className="jj-frame jj-cut p-1">
        <div className="jj-frame__bevel jj-cut p-1">
          <div className="jj-frame__body jj-cut">
            <header className="jj-header px-6 py-9 text-center sm:px-8">
              <h2 className="jj-title text-base sm:text-xl">
                Registrations
                <br />
                <em>Closed</em>
              </h2>
            </header>

            <div className="jj-checker" aria-hidden="true" />

            <div className="px-6 py-12 text-center sm:px-8">
              <div className="flex flex-col items-center gap-6">
                <span className="jj-done__coin" aria-hidden="true" />
                <p className="jj-hint max-w-sm">
                  Sign-ups shut on {deadline}. Follow the NCS Club channels for
                  the next jam — or come say hi at the venue on 13 August.
                </p>
              </div>
            </div>

            <div className="jj-checker" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
