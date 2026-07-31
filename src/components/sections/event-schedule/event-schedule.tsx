"use client";

import { useState } from "react";
import { SCHEDULE } from "./content";
import "./event-schedule.css";

const HEADING_ID = "event-schedule-heading";
const ART = "/sections/schedule";

/* The pieces have finished ends, so five overlapping copies cover the full
   width without a visible repeat. Only the two short rocks are used — the tall
   one hangs about twice as deep and swamps everything under it. */
const CEILING = [
  "ceiling-wide",
  "ceiling-mid",
  "ceiling-wide",
  "ceiling-mid",
  "ceiling-wide",
];

/* Pixel decorations placed where the prototype has them: ember cluster on the
   left wall, lava orb on the right, star sparkle down by the platform. */
const DECOR = [
  {
    src: "ember-cluster",
    className: "es__decor es__decor--embers",
    style: { left: "4%", top: "44%", width: "46px" },
  },
  {
    src: "lava-orb",
    className: "es__decor es__decor--orb",
    style: { right: "4%", top: "54%", width: "40px" },
  },
  {
    src: "spark-star",
    className: "es__decor es__decor--star",
    style: { left: "82%", bottom: "9%", width: "58px" },
  },
  {
    src: "ember-cluster",
    className: "es__decor es__decor--embers",
    style: { left: "10%", bottom: "16%", width: "34px" },
  },
] as const;

/* little flames drifting up off the lava platform */
const EMBERS = [
  { left: "36%", bottom: "8%", size: 6, delay: "0s", duration: "6.4s" },
  { left: "44%", bottom: "5%", size: 4, delay: "2.2s", duration: "7.6s" },
  { left: "52%", bottom: "9%", size: 7, delay: "1.1s", duration: "5.9s" },
  { left: "58%", bottom: "6%", size: 5, delay: "3.6s", duration: "8.1s" },
  { left: "64%", bottom: "10%", size: 4, delay: "4.8s", duration: "6.8s" },
  { left: "48%", bottom: "12%", size: 5, delay: "5.7s", duration: "7.2s" },
];

export function EventSchedule() {
  const [active, setActive] = useState(SCHEDULE[0].id);
  const day = SCHEDULE.find((item) => item.id === active) ?? SCHEDULE[0];

  return (
    <section id="schedule" className="es" aria-labelledby={HEADING_ID}>
      <div className="es__ceiling" aria-hidden="true">
        {CEILING.map((piece, index) => (
          <img key={index} src={`${ART}/${piece}.png`} alt="" />
        ))}
      </div>

      {EMBERS.map((ember, index) => (
        <span
          key={`ember-${index}`}
          className="es__ember"
          aria-hidden="true"
          style={{
            left: ember.left,
            bottom: ember.bottom,
            width: ember.size,
            height: ember.size,
            animationDelay: ember.delay,
            animationDuration: ember.duration,
          }}
        />
      ))}

      {DECOR.map((item, index) => (
        <img
          key={`${item.src}-${index}`}
          className={item.className}
          src={`${ART}/${item.src}.png`}
          alt=""
          aria-hidden="true"
          style={item.style}
        />
      ))}

      <h2 className="es__title" id={HEADING_ID}>
        Event Schedule
      </h2>

      {/* everything below shares one width, so Amy can line up with the last
          tab and the board keeps the prototype's 70% proportion */}
      <div className="es__inner">
        <img
          className="es__amy"
          src={`${ART}/amy.png`}
          alt=""
          aria-hidden="true"
        />

        <div className="es__tabs" role="tablist" aria-label="Schedule day">
          {SCHEDULE.map((item) => (
            <span className="es__tab-slot" key={item.id}>
              {item.id === active ? (
                <span className="es__cursor" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                role="tab"
                id={`${item.id}-tab`}
                aria-selected={item.id === active}
                aria-controls={`${item.id}-panel`}
                className="es__tab"
                onClick={() => setActive(item.id)}
              >
                {item.tab}
              </button>
            </span>
          ))}
        </div>

        <div
          className="es__board"
          role="tabpanel"
          id={`${day.id}-panel`}
          aria-labelledby={`${day.id}-tab`}
        >
          <div className="es__list">
            {day.entries.map((entry) => (
              <div className="es__row" key={`${day.id}-${entry.time}`}>
                <span className="es__time">{entry.time}</span>
                <p className="es__what">
                  {entry.title}
                  {entry.note ? (
                    <span className="es__note">{entry.note}</span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>

        <img
          className="es__platform"
          src={`${ART}/lava-platform.png`}
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
