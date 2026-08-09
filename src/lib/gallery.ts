import "server-only";

import { supabaseAdmin } from "@/lib/supabase";
import { SUBMISSIONS_BUCKET, type GameSubmission } from "@/lib/submissions";

/**
 * The public read side of the arcade.
 *
 * Separate from `submissions.ts` on purpose: that module is the staff view and
 * returns whole rows. Everything here is shaped for pages anyone can open, so
 * it selects columns explicitly rather than `*` — a column added later for
 * internal use cannot leak onto a public page by accident.
 *
 * The storage bucket stays private. Downloads are signed per request, which is
 * why both pages are dynamic: a cached page would serve an expired link.
 */

/** Long enough to read a page and start a 500 MB download without it dying. */
const SIGNED_TTL = 60 * 60;

const CARD_COLUMNS =
  "id, slug, team_name, game_title, cover_path, build_size, created_at";

export type GameCard = {
  id: string;
  slug: string;
  team_name: string;
  game_title: string;
  build_size: number;
  created_at: string;
  coverUrl: string | null;
};

export type GamePage = GameCard & {
  notes: string | null;
  other_links: string[];
  buildName: string;
  buildUrl: string | null;
  reportUrl: string | null;
  reportIsFile: boolean;
  deckUrl: string | null;
  deckIsFile: boolean;
};

function storage() {
  return supabaseAdmin().storage.from(SUBMISSIONS_BUCKET);
}

/** A stored file becomes a signed URL; a pasted link is already one. */
async function signed(path: string | null, downloadAs?: string | null) {
  if (!path) return null;
  const { data } = await storage().createSignedUrl(path, SIGNED_TTL, {
    download: downloadAs ?? undefined,
  });
  return data?.signedUrl ?? null;
}

/** Every entry, newest first, with cover art. */
export async function listGames(): Promise<GameCard[]> {
  const { data, error } = await supabaseAdmin()
    .from("game_submissions")
    .select(CARD_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all(
    ((data ?? []) as (GameCard & { cover_path: string })[]).map(
      async ({ cover_path, ...card }) => ({
        ...card,
        coverUrl: await signed(cover_path),
      }),
    ),
  );
}

/** How many entries are in, for the locked screen. No other detail escapes. */
export async function countGames() {
  const { count, error } = await supabaseAdmin()
    .from("game_submissions")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

/** One team's page, or null if that slug is not a game. */
export async function getGame(slug: string): Promise<GamePage | null> {
  const { data, error } = await supabaseAdmin()
    .from("game_submissions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as GameSubmission & { slug: string };

  return {
    id: row.id,
    slug: row.slug,
    team_name: row.team_name,
    game_title: row.game_title,
    build_size: row.build_size,
    created_at: row.created_at,
    notes: row.notes,
    other_links: row.other_links ?? [],
    /* inline for the hero image, attachment for the download button */
    coverUrl: await signed(row.cover_path),
    buildName: row.build_name,
    buildUrl: await signed(row.build_path, row.build_name),
    reportUrl:
      (await signed(row.report_path, row.report_name)) ?? row.report_url,
    reportIsFile: Boolean(row.report_path),
    deckUrl: (await signed(row.deck_path, row.deck_name)) ?? row.deck_url,
    deckIsFile: Boolean(row.deck_path),
  };
}

/** Slugs for the route, so Next can prerender the ones that exist. */
export async function listGameSlugs() {
  const { data, error } = await supabaseAdmin()
    .from("game_submissions")
    .select("slug");

  if (error) throw error;
  return ((data ?? []) as { slug: string }[]).map((row) => row.slug);
}
