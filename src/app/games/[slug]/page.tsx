import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGame } from "@/lib/gallery";
import { isGalleryOpen } from "@/config/site";
import { ArcadeShell } from "../arcade-parts";
import GameDetail from "../game-detail";

/* Signed, expiring download links — never cache this page. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isGalleryOpen()) return { title: "The Arcade | Jammy Jam" };

  const { slug } = await params;
  const game = await getGame(slug).catch(() => null);
  if (!game) return { title: "Game not found | Jammy Jam" };

  return {
    title: `${game.game_title} by ${game.team_name} | Jammy Jam`,
    description:
      game.notes?.slice(0, 160) ??
      `A game built at Jammy Jam by ${game.team_name}.`,
  };
}

export default async function GamePage({ params }: Props) {
  /* The gate is here as well as on the shelf: without it, anyone holding a
     guessed team slug could read a submission before the doors open. */
  if (!isGalleryOpen()) notFound();

  const { slug } = await params;
  const game = await getGame(slug).catch(() => null);
  if (!game) notFound();

  return (
    <ArcadeShell>
      <GameDetail
        backHref="/games"
        game={{ ...game, downloadHref: game.buildUrl }}
      />
    </ArcadeShell>
  );
}
