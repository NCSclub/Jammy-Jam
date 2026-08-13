import type { Metadata } from "next";
import { countGames, listGames } from "@/lib/gallery";
import { canSeeGames, isSubmissionsClosed } from "@/lib/event-state";
import {
  ArcadeGrid,
  ArcadeLockedShelf,
  ArcadeNotice,
  ArcadeShell,
  ShelfHeader,
} from "../arcade-parts";

export const metadata: Metadata = {
  title: "Other Games | Jammy Jam",
  description: "Every game built at Jammy Jam. Play them all.",
};

/* Download links are signed per request and expire, so this page can never be
   cached — a cached copy would hand out dead URLs. */
export const dynamic = "force-dynamic";

/**
 * The library: everyone's games, open to anyone with the address.
 *
 * Split off /games on purpose. That page is the clock and the hand-in, this one
 * is the shelf, and a team mid-submission should not have to scroll past
 * everyone else's work to reach the button.
 */
export default async function ShelfPage() {
  const open = await canSeeGames();

  /* Before the deadline only the head-count crosses the line: no titles, no
     covers, no team names. Nothing a team could scout mid-jam. */
  let games: Awaited<ReturnType<typeof listGames>> = [];
  let count = 0;
  let failed = false;

  try {
    if (open) {
      games = await listGames();
      count = games.length;
    } else {
      count = await countGames();
    }
  } catch {
    failed = true;
  }

  return (
    <ArcadeShell wide>
      <ShelfHeader open={open} count={count} />

      {failed ? (
        <ArcadeNotice title="The games are offline">
          They could not be loaded. Try again in a moment.
        </ArcadeNotice>
      ) : !open ? (
        <ArcadeLockedShelf count={count} />
      ) : games.length === 0 ? (
        <ArcadeNotice title="Nothing here yet">
          {/* An empty open shelf means two different things depending on
              whether the doors are shut: nobody handed a game in, or (in the
              ARCADE_UNLOCKED dev peek) everyone's games are still coming. */}
          {(await isSubmissionsClosed())
            ? "No games were submitted before the doors closed."
            : "The games will show up here once submissions close."}
        </ArcadeNotice>
      ) : (
        <ArcadeGrid games={games} />
      )}
    </ArcadeShell>
  );
}
