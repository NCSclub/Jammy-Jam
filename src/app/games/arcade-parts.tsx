import Image from "next/image";
import Link from "next/link";
import CloudField from "@/components/CloudField";
import { pixelFontVars } from "@/lib/pixel-fonts";
import { formatBytes } from "@/lib/submission-limits";
import type { SubmissionPhase } from "@/lib/event-window";
import ArcadeClock from "./arcade-clock";
import "./games.css";

/**
 * The arcade's shared furniture.
 *
 * Both the live pages and the throwaway preview render these, so the preview
 * cannot drift from the thing it is previewing — the only difference between
 * them is where the data comes from.
 */

/** Everything a shelf card shows. There is no team page behind it: the card
    is the whole entry, so the build link travels with it. */
export type GameCardData = {
  id: string;
  team_name: string;
  game_title: string;
  notes: string | null;
  /* Null when the team submitted without a build — the card keeps its cover
     and its write-up and simply has nothing to hand over. */
  buildName: string | null;
  build_size: number | null;
  coverUrl: string | null;
  downloadHref: string | null;
};

/**
 * Sky, page column, Green Hill floor.
 *
 * `sonic` puts the runner on the grass. Only the front page asks for him: on a
 * shelf full of cards he is one more thing competing for the eye, and the point
 * of that page is the games.
 */
export function ArcadeShell({
  banner,
  sonic = false,
  wide = false,
  children,
}: {
  banner?: React.ReactNode;
  sonic?: boolean;
  /** A wider column for the shelf: three cards fit better with room to spare. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className={`arcade ${pixelFontVars}`}>
      <div className="arcade__sky" aria-hidden="true" />
      {/* the hero's own cloud sprites, so the arcade opens on the same sky */}
      <div className="arcade__clouds">
        <CloudField />
      </div>
      <div className={`arcade__inner${wide ? " arcade__inner--wide" : ""}`}>
        {banner}
        {children}
      </div>
      <div className="arcade__ground" aria-hidden="true">
        {/* the site's own runner, standing on the grass the way he does in the
            About section — the strip he stands on was cut from around him */}
        {sonic ? (
          <>
            <Image
              className="arcade__sonic"
              src="/sonic-emerald.png"
              alt=""
              width={185}
              height={182}
            />
            {/* Shadow on the far side, looking back at him across the page */}
            <Image
              className="arcade__shadow"
              src="/shadow.png"
              alt=""
              width={143}
              height={192}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}

/**
 * The arcade with nobody in it, blurred, for pages that want to sit on the
 * world rather than on a flat colour. Sky, clouds and the Green Hill floor —
 * the same three layers the shell draws, minus the column of content.
 *
 * Fixed to the viewport, so a long form scrolls over a scene that stays put.
 */
export function ArcadeBackdrop() {
  return (
    <div className="arcade arcade--backdrop" aria-hidden="true">
      <div className="arcade__sky" />
      <div className="arcade__clouds">
        <CloudField />
      </div>
      <div className="arcade__ground" />
    </div>
  );
}

/**
 * Title, the deadline clock and the submit button — the reason this page and
 * the submission page are no longer two separate destinations.
 *
 * Three states, matching the three the server can be in. Before the desk
 * opens, the clock counts down to that instead and there is no button to press
 * — a team who arrives early gets a time, not a form that would be refused.
 * While the jam runs, the clock and the button are the point of the page and
 * the shelf below is empty. Once the doors shut both retire and the games take
 * over, which is why the tally changes wording rather than disappearing.
 */
export function ArcadeHeader({
  phase,
  count,
  deadline,
}: {
  phase: SubmissionPhase;
  count: number;
  /** The next boundary the clock counts to: opening, or closing. */
  deadline: string;
}) {
  const closed = phase === "after";

  return (
    <header className={`arcade__head${closed ? " arcade__head--closed" : ""}`}>
      <h1 className="arcade__title">
        The <em>Arcade</em>
      </h1>
      <p className="arcade__lede">
        {closed
          ? "Every game built at Jammy Jam. Grab a build and go play it."
          : phase === "before"
            ? "The hand-in desk is not open yet. Come back when the clock runs out and drop your build here."
            : "Hand your game in before time runs out, then take a look at what everyone else has built and give their games a try."}
      </p>

      {closed ? (
        <p className="arcade__closed">Submissions closed</p>
      ) : phase === "before" ? (
        <ArcadeClock deadline={deadline} label="Submissions open in" doneLabel="Opening any moment…" />
      ) : (
        <>
          <ArcadeClock deadline={deadline} />
          <Link className="arcade__cta" href="/submit">
            ▸ Submit your game
          </Link>
        </>
      )}

      {/* Everyone else's work lives on its own page: this one is the clock and
          the hand-in, and mixing the two was what made it feel crowded. */}
      <Link className="arcade__cta arcade__cta--shelf" href="/games/shelf">
        {closed ? "▸ Play other games" : "▾ See other games"}
      </Link>

      <p className="arcade__tally">
        <strong>{count}</strong> {count === 1 ? "game" : "games"}{" "}
        {closed ? "up for grabs" : "handed in so far"}
      </p>
    </header>
  );
}

/**
 * The library: three to a row, every entry complete on its own card.
 *
 * A card carries only what a visitor needs to play the thing — the screenshot,
 * who made it, what it is, and the build. The report, the deck and a team's
 * own links are jury material and stay off the public shelf.
 */
export function ArcadeGrid({ games }: { games: GameCardData[] }) {
  return (
    <ul className="arcade__grid">
      {games.map((game) => (
        <li key={game.id}>
          <article className="game-card">
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
              <Notes text={game.notes} />

              {game.downloadHref ? (
                <a className="game-card__cta" href={game.downloadHref}>
                  ↓ Download &amp; play
                </a>
              ) : (
                /* Two different silences: a build that exists but could not be
                   signed is a fault, one that was never sent is a choice. */
                <span className="game-card__cta is-off" aria-disabled="true">
                  {game.buildName ? "Build unavailable" : "No build submitted"}
                </span>
              )}
              {game.buildName && game.build_size !== null ? (
                <p className="game-card__meta">
                  {game.buildName} · {formatBytes(game.build_size)}
                </p>
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

/**
 * A team's write-up, folded after four lines when there is more than that.
 *
 * The cut-off is a character count rather than a measurement: measuring means
 * JavaScript in the browser on every card, and a card that renders long and
 * then snaps shorter. 260 characters is about four lines in this column, so a
 * write-up under it is shown whole and never grows a pointless "see more"; over
 * it, the clamp does the real trimming and the toggle just releases it.
 *
 * A `<details>` again, so the shelf stays a server component. The summary is
 * ordered last by flexbox — it has to be the element's first child to work.
 */
const NOTES_FOLD = 260;

function Notes({ text }: { text: string | null }) {
  if (!text) return null;

  if (text.length <= NOTES_FOLD) {
    return <p className="game-card__notes">{text}</p>;
  }

  return (
    <details className="game-card__more">
      <summary className="game-card__more-btn">
        <span className="game-card__more-open">See more</span>
        <span className="game-card__more-shut">See less</span>
      </summary>
      <p className="game-card__notes">{text}</p>
    </details>
  );
}

/**
 * The shelf before the doors open: the grid's shape, blurred, with the notice
 * pinned to the middle of it.
 *
 * The tiles are empty on purpose. A CSS blur is paint, not privacy — putting
 * the real covers and titles behind one would hand every team the others'
 * entries via view-source. These carry nothing, so there is nothing to read,
 * and the count is the only fact that crosses the line (it already did: the
 * header has been showing it all jam).
 */
export function ArcadeLockedShelf({ count }: { count: number }) {
  /* enough tiles to read as a full shelf while the jam is still quiet, and
     never so many that the note floats in the middle of an empty page */
  const tiles = Math.min(Math.max(count, 6), 9);

  return (
    <div className="arcade__locked">
      <ul className="arcade__grid arcade__grid--ghost" aria-hidden="true">
        {Array.from({ length: tiles }, (_, i) => (
          <li key={i}>
            <div className={`game-card ghost ghost--${(i % 3) + 1}`}>
              <div className="ghost__cover" />
              <div className="ghost__body">
                <span className="ghost__line ghost__line--team" />
                <span className="ghost__line ghost__line--title" />
                <span className="ghost__line" />
                <span className="ghost__line ghost__line--short" />
                <span className="ghost__cta" />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="arcade__note-slot">
        <div className="arcade__note" role="status">
          <span className="arcade__note-tape" aria-hidden="true" />
          <h2>The shelf is still locked</h2>
          <p>Every game appears here once submissions are over.</p>
        </div>
      </div>
    </div>
  );
}

/** The games page's own title block — the arcade header minus the clock. */
export function ShelfHeader({ open, count }: { open: boolean; count: number }) {
  return (
    <>
      <div className="arcade__bar">
        <Link className="arcade__back" href="/games">
          ← The arcade
        </Link>
      </div>

      <header className="arcade__head">
        <h1 className="arcade__title">
          Other <em>Games</em>
        </h1>
        <p className="arcade__lede">
          {open
            ? "Every game built at Jammy Jam. Grab a build and go play it."
            : "Everything handed in so far, still under wraps. Come back once submissions close."}
        </p>
        <p className="arcade__tally">
          <strong>{count}</strong> {count === 1 ? "game" : "games"}{" "}
          {open ? "up for grabs" : "handed in so far"}
        </p>
      </header>
    </>
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
