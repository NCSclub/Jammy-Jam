"use client";

import { useEffect, useState } from "react";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: diff <= 0,
  };
}

const UNITS = ["Days", "Hrs", "Min", "Sec"] as const;

/**
 * Counts down to the next moment the doors move — opening or closing,
 * whichever is next, as the admin set it in `event_state`.
 *
 * The display, not the decision. Whether submissions are actually open is
 * resolved on the server against the server's clock, so this hitting zero
 * changes nothing by itself and winding a laptop forward gets a zeroed timer
 * and nothing else. If the organizers run late, the timer sits at zero with
 * "closing any moment" while the doors stay open — which is exactly what the
 * teams in the room are being told.
 *
 * Renders a dashed placeholder on the first paint: the server does not know
 * the visitor's "now", so committing to a number during SSR guarantees a
 * hydration mismatch a second later. Reserving the same box means the header
 * does not jump when the real digits arrive.
 */
export default function ArcadeClock({
  deadline,
  label = "Submissions close in",
  doneLabel = "Closing any moment — hand it in!",
}: {
  deadline: string;
  label?: string;
  doneLabel?: string;
}) {
  const target = new Date(deadline).getTime();
  const [left, setLeft] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    // Syncing with an external clock, not deriving state from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeft(remaining(target));
    const tick = setInterval(() => setLeft(remaining(target)), 1000);
    return () => clearInterval(tick);
  }, [target]);

  const values = left
    ? [left.days, left.hours, left.minutes, left.seconds]
    : null;

  return (
    <div className="arcade__timer">
      <p className="arcade__timer-label">
        {left?.done ? doneLabel : label}
      </p>
      <div
        className="arcade__clock"
        role="timer"
        aria-live="off"
        aria-label={
          left
            ? `${left.days} days, ${left.hours} hours and ${left.minutes} minutes left to submit`
            : "Loading time remaining"
        }
      >
        {UNITS.map((unit, index) => (
          <div className="arcade__unit" key={unit}>
            <span aria-hidden="true">
              {values ? pad(values[index]) : "--"}
            </span>
            <small aria-hidden="true">{unit}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
