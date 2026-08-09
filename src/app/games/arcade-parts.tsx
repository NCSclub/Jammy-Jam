import Link from "next/link";
import CloudField from "@/components/CloudField";
import { pixelFontVars } from "@/lib/pixel-fonts";
import ArcadeClock from "./arcade-clock";
import "./games.css";

/**
 * The arcade's shared furniture.
 *
 * Both the live pages and the throwaway preview render these, so the preview
 * cannot drift from the thing it is previewing — the only difference between
 * them is where the data comes from and what `basePath` the cards link to.
 */

export type GameCardData = {
  id: string;
  slug: string;
  team_name: string;
  game_title: string;
  coverUrl: string | null;
};

/** Sky, page column, Green Hill floor. */
export function ArcadeShell({
  banner,
  children,
}: {
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className={`arcade ${pixelFontVars}`}>
      <div className="arcade__sky" aria-hidden="true" />
      {/* the hero's own cloud sprites, so the arcade opens on the same sky */}
      <div className="arcade__clouds">
        <CloudField />
      </div>
      <div className="arcade__inner">
        {banner}
        {children}
      </div>
      <div className="arcade__ground" aria-hidden="true" />
    </main>
  );
}

/**
 * Title, the deadline clock and the submit button — the reason this page and
 * the submission page are no longer two separate destinations.
 *
 * While the jam runs, the clock and the button are the point of the page and
 * the shelf below is empty. Once the deadline passes both retire and the games
 * take over, which is why the tally changes wording rather than disappearing.
 */
export function ArcadeHeader({
  closed,
  count,
  deadline,
}: {
  closed: boolean;
  count: number;
  deadline: string;
}) {
  return (
    <header className="arcade__head">
      <h1 className="arcade__title">
        The <em>Arcade</em>
      </h1>
      <p className="arcade__lede">
        {closed
          ? "Every game built at Jammy Jam. Open a team's page, grab the build, and go play it."
          : "Drop your game off before the clock hits zero. The moment it does, every game unlocks, and everyone gets to play everyone else's."}
      </p>

      {closed ? (
        <p className="arcade__closed">Submissions closed</p>
      ) : (
        <>
          <ArcadeClock deadline={deadline} />
          <Link className="arcade__cta" href="/submit">
            ▸ Submit your game
          </Link>
        </>
      )}

      <p className="arcade__tally">
        <strong>{count}</strong> {count === 1 ? "game" : "games"}{" "}
        {closed ? "on the shelf" : "handed in so far"}
      </p>
    </header>
  );
}

export function ArcadeGrid({
  games,
  basePath,
}: {
  games: GameCardData[];
  basePath: string;
}) {
  return (
    <ul className="arcade__grid">
      {games.map((game) => (
        <li key={game.id}>
          <Link className="game-card" href={`${basePath}/${game.slug}`}>
            {game.coverUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- a signed
                 URL that expires; next/image would cache a dead link */
              <img
                className="game-card__cover"
                src={game.coverUrl}
                alt={`${game.game_title} cover art`}
                loading="lazy"
              />
            ) : (
              <div
                className="game-card__cover game-card__cover--missing"
                aria-hidden="true"
              />
            )}
            <div className="game-card__body">
              <p className="game-card__team">{game.team_name}</p>
              <h2 className="game-card__title">{game.game_title}</h2>
              <span className="game-card__cta">View &amp; download →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The shelf before the deadline, and the two things that can go wrong after. */
export function ArcadeNotice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="arcade__panel">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
