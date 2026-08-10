import Link from "next/link";
import { formatBytes } from "@/lib/submission-limits";
import "./games.css";

/**
 * One team's page body — the shelf card at full size, and nothing more.
 *
 * Shared by the live route and the preview so both show the same thing;
 * `downloadHref` is null when the build could not be signed. The report, the
 * deck and a team's own links are deliberately absent: they are jury material,
 * and this page is public the moment the shelf unlocks.
 */

export type GameDetailData = {
  team_name: string;
  game_title: string;
  notes: string | null;
  buildName: string;
  build_size: number;
  coverUrl: string | null;
  downloadHref: string | null;
};

export default function GameDetail({
  game,
  backHref,
}: {
  game: GameDetailData;
  backHref: string;
}) {
  return (
    <>
      {/* the only chrome left on this page — without it the shelf is
          unreachable except by the browser's own back button */}
      <div className="arcade__bar">
        <Link className="arcade__back" href={backHref}>
          ← All games
        </Link>
      </div>

      <div className="game">
        <div className="game__shot">
          {game.coverUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- signed URL
               with a lifetime; next/image would cache a dead link */
            <img src={game.coverUrl} alt={`${game.game_title} cover art`} />
          ) : (
            <div
              className="game-card__cover game-card__cover--missing"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="game__panel">
          <p className="game__team">{game.team_name}</p>
          <h1 className="game__title">{game.game_title}</h1>

          {game.notes ? <p className="game__notes">{game.notes}</p> : null}

          {game.downloadHref ? (
            <a className="game__download" href={game.downloadHref}>
              ↓ Download &amp; play
            </a>
          ) : (
            <span className="game__download is-off" aria-disabled="true">
              Build unavailable
            </span>
          )}
          <p className="game__meta">
            {game.buildName} · {formatBytes(game.build_size)}
          </p>
        </div>
      </div>
    </>
  );
}

