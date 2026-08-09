import type { Metadata } from "next";
import { GALLERY_OPENS_AT } from "@/config/site";
import { ArcadeGrid, ArcadeHeader, ArcadeShell } from "../arcade-parts";
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
    slug: game.slug,
    team_name: game.team_name,
    game_title: game.game_title,
    coverUrl: fakeCover(game),
  }));

  return (
    <ArcadeShell banner={<PreviewFlag phase={closed ? "open" : "jam"} />}>
      <ArcadeHeader
        closed={closed}
        count={games.length}
        deadline={GALLERY_OPENS_AT.toISOString()}
      />

      {closed ? (
        <ArcadeGrid games={games} basePath="/games/preview" />
      ) : (
        <div className="arcade__panel">
          <h2>The shelf is still locked</h2>
          <p>
            Every game appears here the moment the clock hits zero. Everyone at
            once, nobody early.
          </p>
        </div>
      )}
    </ArcadeShell>
  );
}
