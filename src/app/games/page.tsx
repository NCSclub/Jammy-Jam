import type { Metadata } from "next";
import { countGames, listGames } from "@/lib/gallery";
import { GALLERY_OPENS_AT, formatGalleryOpening, isGalleryOpen } from "@/config/site";
import {
  ArcadeGrid,
  ArcadeHeader,
  ArcadeNotice,
  ArcadeShell,
} from "./arcade-parts";

export const metadata: Metadata = {
  title: "The Arcade | Jammy Jam",
  description:
    "Hand your game in, then play everything else built at Jammy Jam.",
};

/* Download links are signed per request and expire, so this page can never be
   cached — a cached copy would hand out dead URLs. */
export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const open = isGalleryOpen();

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
    <ArcadeShell>
      <ArcadeHeader
        closed={open}
        count={count}
        deadline={GALLERY_OPENS_AT.toISOString()}
      />

      {failed ? (
        <ArcadeNotice title="The arcade is offline">
          The shelf could not be loaded. Try again in a moment.
        </ArcadeNotice>
      ) : !open ? (
        <ArcadeNotice title="The shelf is still locked">
          Every game appears here the moment the clock hits zero, on{" "}
          {formatGalleryOpening()} (Algiers time). Everyone at once, nobody early.
        </ArcadeNotice>
      ) : games.length === 0 ? (
        <ArcadeNotice title="Nothing on the shelf">
          No games were submitted before the deadline.
        </ArcadeNotice>
      ) : (
        <ArcadeGrid games={games} basePath="/games" />
      )}
    </ArcadeShell>
  );
}
