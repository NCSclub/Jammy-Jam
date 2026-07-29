export type ScheduleDay = {
  id: string;
  tab: string;
  entries: { time: string; title: string; note?: string }[];
};

/* PLACEHOLDER — tab labels follow the prototype (DAY 1-5 / DAY 6 / DAY 7).
   Swap these for the real running order; the layout adapts to any labels. */
export const SCHEDULE: ScheduleDay[] = [
  {
    id: "day-1-5",
    tab: "Day 1-5",
    entries: [
      { time: "18:00", title: "Workshops open", note: "Online, every evening" },
      { time: "19:00", title: "Engine crash course", note: "Godot and Unity tracks" },
      { time: "20:30", title: "Art and audio clinic" },
      { time: "21:30", title: "Team matchmaking", note: "Solo players welcome" },
    ],
  },
  {
    id: "day-6",
    tab: "Day 6",
    entries: [
      { time: "09:00", title: "Doors open", note: "Check-in and badges" },
      { time: "10:00", title: "Opening ceremony" },
      { time: "10:30", title: "Theme reveal", note: "Jam officially starts" },
      { time: "12:30", title: "Lunch break" },
      { time: "15:00", title: "Mentor round 1", note: "Design and code clinics" },
      { time: "19:00", title: "Dinner" },
      { time: "21:00", title: "Night session", note: "Venue stays open" },
    ],
  },
  {
    id: "day-7",
    tab: "Day 7",
    entries: [
      { time: "08:30", title: "Breakfast" },
      { time: "10:00", title: "Mentor round 2", note: "Playtesting and polish" },
      { time: "13:00", title: "Lunch break" },
      { time: "16:00", title: "Submission deadline", note: "Builds locked" },
      { time: "17:00", title: "Play session", note: "Everyone plays everything" },
      { time: "19:00", title: "Judging" },
      { time: "20:30", title: "Awards and closing" },
    ],
  },
];
