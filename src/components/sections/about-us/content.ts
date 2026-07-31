/**
 * The copy for both blocks.
 *
 * Highlighted words carry a `tone` so the colours live with the text rather
 * than the markup, and `breakAfter` reproduces the exact line breaks from the
 * prototype. The breaks only apply on wide screens — below 900px the text
 * wraps naturally, since the designed breaks would leave ragged short lines.
 */
export type Piece = {
  text: string;
  tone?: "gold" | "cyan" | "red" | "pink";
  breakAfter?: boolean;
};

/* Board lines:
   The NCS CLUB is a student organization
   at NUMIDIA INSTITUTE OF TECHNOLOGY,
   that provides an inclusive platform for
   TECH enthusiasts
   to boost their computer science SKILLS.
   Through workshops and projects,
   they foster community GROWTH.                                            */
export const ABOUT_BOARD: Piece[] = [
  { text: "The " },
  { text: "NCS Club", tone: "gold" },
  { text: " is a student organization", breakAfter: true },
  { text: "at " },
  { text: "Numidia Institute of Technology", tone: "gold" },
  { text: ",", breakAfter: true },
  { text: "that provides an inclusive platform for", breakAfter: true },
  { text: "tech", tone: "red" },
  { text: " enthusiasts", breakAfter: true },
  { text: "to boost their computer science " },
  { text: "skills", tone: "red" },
  { text: ".", breakAfter: true },
  { text: "Through workshops and projects,", breakAfter: true },
  { text: "they foster community " },
  { text: "growth", tone: "red" },
  { text: "." },
];

/* What-is lines:
   JAMMY JAM is a 7-DAY (5 days ONLINE and 2
   PRESENTIAL) game jam organized by Numidia Computer
   Society (NCS) that brings together game developers,
   artists, designers, and enthusiasts to create original
   games around a surprise theme. Through collaboration,
   creativity, and mentorship, participants transform
   ideas into playable games while connecting with
   fellow creators in a fun and inspiring environment.

   Every highlight here is the same red, unlike the board above.            */
export const WHAT_IS: Piece[] = [
  { text: "Jammy Jam", tone: "red" },
  { text: " is a " },
  { text: "7-day", tone: "red" },
  { text: " (5 days " },
  { text: "online", tone: "red" },
  { text: " and 2", breakAfter: true },
  { text: "presential", tone: "red" },
  { text: ") game jam organized by Numidia Computer", breakAfter: true },
  { text: "Society (" },
  { text: "NCS", tone: "red" },
  { text: ") that brings together game developers,", breakAfter: true },
  { text: "artists, designers, and enthusiasts to create original", breakAfter: true },
  { text: "games around a surprise theme. Through collaboration,", breakAfter: true },
  { text: "creativity, and mentorship, participants transform", breakAfter: true },
  { text: "ideas into playable games while connecting with", breakAfter: true },
  { text: "fellow creators in a fun and inspiring environment." },
];
