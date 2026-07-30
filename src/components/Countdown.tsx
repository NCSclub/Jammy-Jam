"use client";

import { useEffect, useMemo, useState } from "react";
import { EVENT_DATE_ISO } from "@/config/site";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

function getTimeLeft(targetIso: string): TimeLeft {
  const diff = new Date(targetIso).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isComplete: false };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

const UNITS: { key: keyof Omit<TimeLeft, "isComplete">; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
];

export default function Countdown() {
  // Initialize lazily on the client to avoid a server/client markup
  // mismatch (the server doesn't know "now").
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Syncing with an external clock (Date.now()), not derived state, so an
    // immediate call here alongside the interval subscription is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(getTimeLeft(EVENT_DATE_ISO));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(EVENT_DATE_ISO));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const display = timeLeft ?? {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false,
  };

  const label = useMemo(
    () =>
      display.isComplete
        ? "Jammy Jam has started!"
        : "Time remaining until Jammy Jam",
    [display.isComplete]
  );

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={label}
      className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-4"
    >
      {UNITS.map((unit, i) => (
        <div key={unit.key} className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4">
          <div className="flex flex-col items-center">
            <span
              className="text-pixel-countdown flex items-center justify-center text-4xl sm:text-4xl md:text-7xl"
              aria-hidden="true"
            >
              {pad(display[unit.key])}
            </span>
            <span className="sr-only">{unit.label}</span>
          </div>
          {i < UNITS.length - 1 && (
            <span
              className="text-pixel-countdown text-2xl sm:text-3xl md:text-5xl"
              aria-hidden="true"
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
