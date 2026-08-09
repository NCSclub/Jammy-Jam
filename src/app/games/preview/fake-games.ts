/**
 * TEMPORARY — throwaway data so the arcade can be looked at before the
 * database has the columns for it. Delete `src/app/games/preview/` once the
 * real gallery is running; nothing outside that folder imports this.
 *
 * The covers are generated SVG rather than image files so the preview drags no
 * binaries into the repo, and so a card can be checked at portrait, square and
 * widescreen — the three shapes a real jam produces and the three that break a
 * grid if the card only ever gets tested with one.
 */

export type FakeGame = {
  slug: string;
  team_name: string;
  game_title: string;
  notes: string | null;
  buildName: string;
  build_size: number;
  reportUrl: string | null;
  reportIsFile: boolean;
  deckUrl: string | null;
  deckIsFile: boolean;
  other_links: string[];
  cover: { w: number; h: number; sky: string; ink: string; accent: string } | null;
};

/** A chunky pixel scene, sized to whatever aspect the card is being tested at. */
export function fakeCover(game: FakeGame) {
  const c = game.cover;
  if (!c) return null;

  const blocks = Array.from({ length: 14 }, (_, i) => {
    const x = (i * 47) % (c.w - 40);
    const y = c.h - 30 - ((i * 31) % Math.max(40, c.h / 2));
    const size = 10 + ((i * 13) % 26);
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${
      i % 3 === 0 ? c.accent : c.ink
    }" opacity="${i % 2 ? 0.75 : 1}"/>`;
  }).join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${c.w}" height="${c.h}" viewBox="0 0 ${c.w} ${c.h}">` +
    `<rect width="${c.w}" height="${c.h}" fill="${c.sky}"/>` +
    blocks +
    `<rect y="${c.h - 26}" width="${c.w}" height="26" fill="${c.ink}"/>` +
    `<rect y="${c.h - 26}" width="${c.w}" height="6" fill="${c.accent}"/>` +
    `<text x="18" y="38" font-family="monospace" font-size="20" fill="#ffffff" opacity="0.92">${escapeXml(
      game.game_title.toUpperCase(),
    )}</text>` +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (ch) =>
    ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : ch === "'" ? "&apos;" : "&quot;",
  );
}

const MB = 1024 * 1024;

export const FAKE_GAMES: FakeGame[] = [
  {
    slug: "neon-dash",
    team_name: "Team Chaos",
    game_title: "Neon Dash",
    notes:
      "A one-button runner about outrunning your own shadow.\n\nArrow keys to move, space to dash. Controller works too. The last level is unfinished — we ran out of Saturday.",
    buildName: "neon-dash-win64.zip",
    build_size: 184 * MB,
    reportUrl: "#", reportIsFile: true,
    deckUrl: "https://www.canva.com/design/example", deckIsFile: false,
    other_links: ["https://www.figma.com/design/abc123/neon-dash-ui-kit", "https://youtu.be/dQw4w9WgXcQ"],
    cover: { w: 640, h: 360, sky: "#241b4d", ink: "#0d0a24", accent: "#ff2e88" },
  },
  {
    slug: "ring-runner",
    team_name: "Les Hérissons",
    game_title: "Ring Runner",
    notes: "Collect every ring before the timer hits zero. Made in Godot in 34 hours.",
    buildName: "RingRunner.zip",
    build_size: 42 * MB,
    reportUrl: "#", reportIsFile: true,
    deckUrl: "#", deckIsFile: true,
    other_links: [],
    cover: { w: 640, h: 640, sky: "#1c7fd6", ink: "#0b3d76", accent: "#ffd23f" },
  },
  {
    slug: "cavern-of-bugs",
    team_name: "Null Pointer",
    game_title: "Cavern of Bugs",
    notes: "A metroidvania where the enemies are your own compiler errors. Sound is loud, sorry.",
    buildName: "cavern-of-bugs.7z",
    build_size: 311 * MB,
    reportUrl: "https://docs.google.com/document/d/example", reportIsFile: false,
    deckUrl: "#", deckIsFile: true,
    other_links: ["https://null-pointer.itch.io/cavern-of-bugs"],
    cover: { w: 480, h: 720, sky: "#123420", ink: "#07160e", accent: "#8ae71a" },
  },
  {
    slug: "pixel-pilots",
    team_name: "Sprite Squad",
    game_title: "Pixel Pilots",
    notes: null,
    buildName: "PixelPilots-v1.rar",
    build_size: 96 * MB,
    reportUrl: "#", reportIsFile: true,
    deckUrl: "#", deckIsFile: true,
    other_links: [],
    cover: { w: 640, h: 360, sky: "#3b1d5e", ink: "#1a0b2e", accent: "#57d8ff" },
  },
  {
    slug: "grand-prix-du-cafe",
    team_name: "Équipe Café",
    game_title: "Grand Prix du Café",
    notes: "Un jeu de course où le carburant, c'est l'espresso. Manette recommandée.",
    buildName: "grand-prix-cafe.zip",
    build_size: 128 * MB,
    reportUrl: "#", reportIsFile: true,
    deckUrl: "https://docs.google.com/presentation/d/example", deckIsFile: false,
    other_links: ["https://equipe-cafe.netlify.app"],
    cover: { w: 640, h: 400, sky: "#7f3002", ink: "#300401", accent: "#ffb24a" },
  },
  {
    /* deliberately coverless: proves the placeholder tile holds the grid */
    slug: "untitled-goose-clone",
    team_name: "Deadline Enjoyers",
    game_title: "Untitled Jam Game",
    notes: "We started 6 hours before the deadline. It runs. That is the whole pitch.",
    buildName: "build-final-FINAL-v3.zip",
    build_size: 7 * MB,
    reportUrl: null, reportIsFile: false,
    deckUrl: "#", deckIsFile: true,
    other_links: [],
    cover: null,
  },
];

export function findFakeGame(slug: string) {
  return FAKE_GAMES.find((game) => game.slug === slug) ?? null;
}
