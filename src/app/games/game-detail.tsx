import Link from "next/link";
import { formatBytes } from "@/lib/submission-limits";
import "./games.css";

/**
 * One team's page body. Shared by the live route and the preview so both show
 * the same thing; `downloadHref` is null when the build could not be signed.
 */

export type GameDetailData = {
  team_name: string;
  game_title: string;
  notes: string | null;
  buildName: string;
  build_size: number;
  coverUrl: string | null;
  downloadHref: string | null;
  reportUrl: string | null;
  reportIsFile: boolean;
  deckUrl: string | null;
  deckIsFile: boolean;
  other_links: string[];
};

export default function GameDetail({
  game,
  backHref,
}: {
  game: GameDetailData;
  backHref: string;
}) {
  const hasDocs = Boolean(
    game.reportUrl || game.deckUrl || game.other_links.length,
  );

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

          {hasDocs ? (
            <>
              <p className="game__section-title">More from this team</p>
              <ul className="game__links">
                <Doc
                  label="Report"
                  href={game.reportUrl}
                  isFile={game.reportIsFile}
                />
                <Doc
                  label="Presentation"
                  href={game.deckUrl}
                  isFile={game.deckIsFile}
                />
                {game.other_links.map((href) => (
                  <li key={href}>
                    <a href={href} target="_blank" rel="noreferrer noopener">
                      <span>{prettyHost(href)}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** A report or deck: a signed download if uploaded, else the team's own link. */
function Doc({
  label,
  href,
  isFile,
}: {
  label: string;
  href: string | null;
  isFile: boolean;
}) {
  if (!href) return null;

  return (
    <li>
      <a
        href={href}
        {...(isFile ? {} : { target: "_blank", rel: "noreferrer noopener" })}
      >
        <span>{label}</span>
        <span aria-hidden="true">{isFile ? "↓" : "↗"}</span>
      </a>
    </li>
  );
}

/** "figma.com/design/abc" reads better on a button than a full query string. */
function prettyHost(href: string) {
  try {
    const url = new URL(href);
    const tail = url.pathname.replace(/\/$/, "");
    return `${url.hostname.replace(/^www\./, "")}${
      tail.length > 24 ? `${tail.slice(0, 24)}…` : tail
    }`;
  } catch {
    return href;
  }
}
