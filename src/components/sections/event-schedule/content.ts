export type ScheduleDay = {
  id: string;
  tab: string;
  /** Optional lines around the timetable, for a day that needs context more
      than it needs rows: the online week is one reveal, then five days of work.
      `lead` sits above the entries, `tail` centred below them. */
  lead?: string;
  tail?: string;
  entries: { time: string; title: string; note?: string }[];
};

/* The real running order. Day 1 is the only online day with anything on the
   clock — the rest of that week is jamming, so there is nothing to list. */
export const SCHEDULE: ScheduleDay[] = [
  {
    id: "day-1",
    tab: "Day 1",
    lead: "Jam starts, build all 5 days online.",
    tail: "5 days of online work",
    entries: [
      { time: "11:00", title: "Theme reveal" },
    ],
  },
  {
    id: "day-6",
    tab: "Day 6",
    entries: [
      { time: "08:30–09:00", title: "Check in" },
      { time: "09:00–09:20", title: "Opening ceremony" },
      { time: "09:20–13:00", title: "Back to work" },
      { time: "12:30–13:30", title: "Lunch break" },
      { time: "13:30–16:30", title: "Back to work" },
      { time: "16:30–17:15", title: "Coffee break" },
      { time: "17:15–20:00", title: "Back to work" },
      { time: "20:00–21:00", title: "Dinner break" },
      { time: "21:00–02:00", title: "Back to work" },
      { time: "02:00–03:00", title: "Snacks break" },
    ],
  },
  {
    id: "day-7",
    tab: "Day 7",
    entries: [
      { time: "07:00–08:00", title: "Breakfast" },
      { time: "08:00–11:00", title: "Project finalization" },
      { time: "11:00", title: "Submission" },
      { time: "12:00–13:00", title: "Lunch break" },
      { time: "13:00–14:00", title: "Jumuaa prayer" },
      { time: "14:00–16:30", title: "Final pitches" },
      { time: "16:30–17:30", title: "Coffee break" },
      { time: "17:30–18:30", title: "Closing ceremony & winners announcement" },
      { time: "18:30–19:00", title: "Closing & Networking" },
    ],
  },
];
