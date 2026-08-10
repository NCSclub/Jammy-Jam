import type { Metadata } from "next";
import { GALLERY_OPENS_AT } from "@/config/site";
import {
  ArcadeGrid,
  ArcadeHeader,
  ArcadeLockedShelf,
  ArcadeShell,
} from "../arcade-parts";
import { FAKE_GAMES, fakeCover } from "./fake-games";
import PreviewFlag from "./preview-flag";
import "./preview.css";

/* TEMPORARY — see fake-games.ts. Renders the real arcade components on
   invented data, with no database and no deadline gate, so the page can be
   looked at before the columns exist. Delete src/app/games/preview/. */
export const metadata: Metadata = {
  title: "Arcade preview | Jammy Jam",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ phase?: string }> };

export default async function ArcadePreview({ searchParams }: Props) {
  /* ?phase=open shows the page after the deadline, which is the state that is
     hardest to reach for real — the live page will not show it until August. */
  const { phase } = await searchParams;
  const closed = phase === "open";

  const games = FAKE_GAMES.map((game) => ({
    id: game.slug,
    team_name: game.team_name,
    game_title: game.game_title,
    notes: game.notes,
    buildName: game.buildName,
    build_size: game.build_size,
    coverUrl: fakeCover(game),
    /* the last one has no signable build, which is the state that decides
       whether the card degrades or collapses */
    downloadHref: game.cover === null ? null : "#",
  }));

  return (
    <ArcadeShell banner={<PreviewFlag phase={closed ? "open" : "jam"} />}>
      <ArcadeHeader
        closed={closed}
        count={games.length}
        deadline={GALLERY_OPENS_AT.toISOString()}
      />

      {closed ? (
        <ArcadeGrid games={games} />
      ) : (
        <ArcadeLockedShelf count={games.length} />
      )}
    </ArcadeShell>
  );
}
