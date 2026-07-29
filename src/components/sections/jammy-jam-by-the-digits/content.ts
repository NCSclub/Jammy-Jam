import type { DigitCard } from "./types";

const ICONS = "/sections/digits";

export const DIGIT_CARDS: readonly DigitCard[] = [
  {
    id: "participants",
    frame: { x: 422, y: 112, w: 617, h: 460 },
    bezelColor: "#859099",
    icon: { src: `${ICONS}/person-added.svg`, x: 53.2467, y: 58.375, w: 86.625, h: 74.25 },
    title: "Participants",
    titleAt: { x: 157, y: 74 },
    value: "80+",
    valueAt: { x: 49, y: 161 },
    description: "Students from various universities-creative minds.",
    descriptionAt: { x: 45, y: 269, w: 564 },
  },
  {
    id: "mentors",
    frame: { x: 89, y: 998, w: 617, h: 460 },
    bezelColor: "#999898",
    icon: { src: `${ICONS}/person-group.svg`, x: 51.2467, y: 58.375, w: 82.5066, h: 74.25 },
    title: "Mentors",
    titleAt: { x: 152, y: 75 },
    value: "15+",
    valueAt: { x: 36, y: 170 },
    description: "Here to support, inspire and help you push your projects further.",
    descriptionAt: { x: 47, y: 262, w: 542 },
  },
  {
    id: "days",
    frame: { x: 770, y: 1636, w: 617, h: 460 },
    bezelColor: "#999898",
    icon: { src: `${ICONS}/diary.svg`, x: 52.2467, y: 60.375, w: 82.5066, h: 78.3783 },
    title: "Days",
    titleAt: { x: 160, y: 78 },
    value: "7",
    valueAt: { x: 52, y: 173 },
    description: "Design, develop, bring your GAME to life.",
    descriptionAt: { x: 43, y: 278, w: 542 },
  },
];
