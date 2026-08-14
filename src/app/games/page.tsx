import type { Metadata } from "next";
import { countGames } from "@/lib/gallery";
import { GALLERY_OPENS_AT } from "@/config/site";
import { getSubmissionWindow } from "@/lib/event-state";
import { nextBoundary, resolvePhase } from "@/lib/event-window";
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
  /* One read, two answers: which of the three states we are in, and the next
     moment that changes. Both come from what the admin set — the hardcoded
     date in src/config/site.ts is only the fallback for a hand-driven jam
     where no closing time was ever entered. */
  const submissionWindow = await getSubmissionWindow();
  const phase = resolvePhase(submissionWindow);
  const deadline = nextBoundary(submissionWindow) ?? GALLERY_OPENS_AT.toISOString();

  let count = 0;
  let failed = false;

  try {
    count = await countGames();
  } catch {
    failed = true;
  }

  return (
    <ArcadeShell sonic>
      <ArcadeHeader
        phase={phase}
        count={count}
        deadline={deadline}
        /* Only a scheduled window has a moment to die on; in manual mode the
           button waits for the organizer's switch instead. */
        closesAt={submissionWindow.scheduled ? submissionWindow.closesAt : null}
      />

      {failed ? (
        <ArcadeNotice title="The arcade is offline">
          The head-count could not be loaded. The shelf still works.
        </ArcadeNotice>
      ) : null}
    </ArcadeShell>
  );
}
