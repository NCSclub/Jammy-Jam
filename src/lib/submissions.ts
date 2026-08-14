import "server-only";

import { supabaseAdmin } from "@/lib/supabase";

export const SUBMISSIONS_BUCKET = "game-submissions";

/* Re-exported so the API routes keep importing the upload rules from here,
   while the browser form imports the same values straight from the module
   below — which, unlike this one, is not server-only. */
export {
  ASSETS,
  assetExtension,
  isAssetKind,
  isHttpUrl,
  MAX_OTHER_LINKS,
  safeFileName,
} from "@/lib/submission-limits";
export type { AssetKind } from "@/lib/submission-limits";

export type GameSubmission = {
  id: string;
  created_at: string;
  team_name: string;
  game_title: string;
  /* The build is optional: a team may hand in the report and the deck and
     still be adding the executable when the desk closes. All three columns
     move together — a row either has a build or has none of it. */
  build_path: string | null;
  build_name: string | null;
  build_size: number | null;
  cover_path: string;
  cover_name: string;
  cover_size: number;
  /* Report and presentation are each either an upload or a link, never both. */
  report_path: string | null;
  report_name: string | null;
  report_size: number | null;
  report_url: string | null;
  deck_path: string | null;
  deck_name: string | null;
  deck_size: number | null;
  deck_url: string | null;
  /** Optional extras the team tacked on: Figma, a demo video, a live build. */
  other_links: string[];
  notes: string | null;
  status: "submitted" | "reviewing" | "reviewed";
};

/** Ten minutes is long enough to start a 500 MB download, short enough that a
    copied URL is not a permanent public link to an unreleased game. */
const SIGNED_URL_TTL = 10 * 60;

export async function listSubmissions() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("game_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const storage = db.storage.from(SUBMISSIONS_BUCKET);

  /** A stored file becomes a signed URL; a pasted link is already one. */
  async function resolve(path: string | null, name: string | null) {
    if (!path) return null;
    const { data: signed } = await storage.createSignedUrl(path, SIGNED_URL_TTL, {
      download: name ?? undefined,
    });
    return signed?.signedUrl ?? null;
  }

  return Promise.all(
    ((data ?? []) as GameSubmission[]).map(async (submission) => ({
      ...submission,
      buildUrl: await resolve(submission.build_path, submission.build_name),
      /* inline, not a download — the jury page renders it as the card art */
      coverUrl: (
        await storage.createSignedUrl(submission.cover_path, SIGNED_URL_TTL)
      ).data?.signedUrl ?? null,
      reportUrl:
        (await resolve(submission.report_path, submission.report_name)) ??
        submission.report_url,
      deckUrl:
        (await resolve(submission.deck_path, submission.deck_name)) ??
        submission.deck_url,
    })),
  );
}
