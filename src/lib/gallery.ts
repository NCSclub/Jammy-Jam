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

/* The shelf is the whole gallery now: a card carries the cover, the write-up
   and the build itself, so the columns a card needs are the columns a page
   used to. Deliberately still explicit — no `*`, no report, no deck, no
   other_links: what the shelf cannot select, the shelf cannot leak. */
const CARD_COLUMNS =
  "id, slug, team_name, game_title, notes, cover_path, build_path, build_name, build_size, created_at";

export type GameCard = {
  id: string;
  slug: string;
  team_name: string;
  game_title: string;
  notes: string | null;
  /* Null together when the team submitted without a build: no name, no size,
     no download. A card with nothing to download still has a cover and a
     write-up, so it renders — it just does not offer a link. */
  build_size: number | null;
  created_at: string;
  coverUrl: string | null;
  buildName: string | null;
  downloadHref: string | null;
};

/* Nothing beyond a card: the report, the deck and a team's own links are jury
   material, and a public page for one game is the shelf's card at full size,
   not a fuller version of it. The jury room reads its own rows for those. */
export type GamePage = GameCard;

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

/** Every entry, newest first, with its cover art and a live download link. */
export async function listGames(): Promise<GameCard[]> {
  const { data, error } = await supabaseAdmin()
    .from("game_submissions")
    .select(CARD_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  type Row = Omit<GameCard, "coverUrl" | "buildName" | "downloadHref"> & {
    cover_path: string | null;
    build_path: string | null;
    build_name: string | null;
  };

  /* Two signatures per card, all of them in flight at once: ten teams is
     twenty round trips, and doing them in sequence is what would be felt. */
  return Promise.all(
    ((data ?? []) as Row[]).map(
      async ({ cover_path, build_path, build_name, ...card }) => {
        const [coverUrl, downloadHref] = await Promise.all([
          signed(cover_path),
          signed(build_path, build_name),
        ]);
        return { ...card, coverUrl, buildName: build_name, downloadHref };
      },
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
  /* the card's columns, not `*`: the row also holds the report, the deck and
     the team's own links, and none of that belongs on a public page */
  const { data, error } = await supabaseAdmin()
    .from("game_submissions")
    .select(CARD_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as GameSubmission & { slug: string };

  const [coverUrl, downloadHref] = await Promise.all([
    signed(row.cover_path),
    signed(row.build_path, row.build_name),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    team_name: row.team_name,
    game_title: row.game_title,
    build_size: row.build_size,
    created_at: row.created_at,
    notes: row.notes,
    coverUrl,
    buildName: row.build_name,
    downloadHref,
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
