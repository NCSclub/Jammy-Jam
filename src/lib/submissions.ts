import "server-only";

import { supabaseAdmin } from "@/lib/supabase";

export const SUBMISSIONS_BUCKET = "game-submissions";

/* Re-exported so the API routes keep importing the build rules from here,
   while the browser form imports the same values straight from the module
   below — which, unlike this one, is not server-only. */
export {
  ALLOWED_BUILD_EXTENSIONS,
  buildExtension,
  MAX_BUILD_SIZE,
  safeBuildName,
} from "@/lib/submission-limits";

export type GameSubmission = {
  id: string;
  created_at: string;
  team_name: string;
  game_title: string;
  contact_email: string;
  description: string;
  controls: string;
  build_path: string;
  build_name: string;
  build_size: number;
  status: "submitted" | "reviewing" | "reviewed";
};

export async function listSubmissions() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("game_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all(
    ((data ?? []) as GameSubmission[]).map(async (submission) => {
      const { data: signed } = await db.storage
        .from(SUBMISSIONS_BUCKET)
        .createSignedUrl(submission.build_path, 10 * 60, {
          download: submission.build_name,
        });

      return { ...submission, downloadUrl: signed?.signedUrl ?? null };
    }),
  );
}
