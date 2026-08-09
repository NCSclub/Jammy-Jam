import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArcadeShell } from "../../arcade-parts";
import GameDetail from "../../game-detail";
import { fakeCover, findFakeGame } from "../fake-games";
import PreviewFlag from "../preview-flag";
import "../preview.css";

/* TEMPORARY — see fake-games.ts. The real GameDetail on invented data. */
export const metadata: Metadata = {
  title: "Arcade preview | Jammy Jam",
  robots: { index: false, follow: false },
};

export default async function PreviewGamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = findFakeGame(slug);
  if (!game) notFound();

  return (
    <ArcadeShell banner={<PreviewFlag phase="open" />}>
      <GameDetail
        backHref="/games/preview?phase=open"
        game={{
          ...game,
          coverUrl: fakeCover(game),
          /* "#" so the button is live to click without downloading anything */
          downloadHref: "#",
        }}
      />
    </ArcadeShell>
  );
}
