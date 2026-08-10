import type { Metadata } from "next";
import { countGames } from "@/lib/gallery";
import { GALLERY_OPENS_AT, isGalleryOpen } from "@/config/site";
import { ArcadeHeader, ArcadeNotice, ArcadeShell } from "./arcade-parts";

export const metadata: Metadata = {
  title: "The Arcade | Jammy Jam",
  description:
    "Hand your game in, then play everything else built at Jammy Jam.",
};

/* The head-count is live all jam, so nothing here may be cached. */
export const dynamic = "force-dynamic";

/**
 * The arcade's front door: the countdown, the hand-in button, and the way
 * through to the shelf at /games/shelf.
 *
 * No game data is read here at all — only how many are in. Everything a
 * visitor could look at lives one click away, which keeps this page the same
 * shape before and after the deadline.
 */
export default async function GamesPage() {
  const open = isGalleryOpen();

  let count = 0;
  let failed = false;

  try {
    count = await countGames();
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
          The head-count could not be loaded. The shelf still works.
        </ArcadeNotice>
      ) : null}
    </ArcadeShell>
  );
}
