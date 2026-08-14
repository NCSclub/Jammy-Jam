import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated, UNAUTHORIZED } from "@/lib/admin-auth";
import { SUBMISSIONS_BUCKET } from "@/lib/submissions";

/**
 * DELETE /api/submissions/:id — throw a game away, admin only.
 *
 * For the test entries an organizer makes while checking the desk works, which
 * would otherwise sit in the jury room being scored alongside real ones.
 *
 * Admin only, never jury: a judge who can delete an entry mid-scoring is one
 * misclick away from destroying a team's whole jam, and `getSessionRole()`
 * lets the jury password through.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const { id } = await params;
  const db = supabaseAdmin();

  /* Read the paths before the row goes: once it is deleted there is nothing
     left pointing at the files, and a 500 MB build nobody can reach still
     counts against the storage quota. */
  const { data: row, error: readError } = await db
    .from("game_submissions")
    .select("build_path, cover_path, report_path, deck_path")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("reading submission before delete failed", readError);
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "That game is already gone." }, { status: 404 });
  }

  const { error } = await db.from("game_submissions").delete().eq("id", id);
  if (error) {
    console.error("deleting submission failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  /* Files come second and their failure is not the caller's problem: the row
     is what the site reads, so the game is already gone from every page. A
     leftover object in the bucket is tidy-up, not a failed delete. */
  const paths = [row.build_path, row.cover_path, row.report_path, row.deck_path]
    .filter((path): path is string => typeof path === "string" && path.length > 0);

  if (paths.length) {
    const { error: storageError } = await db.storage
      .from(SUBMISSIONS_BUCKET)
      .remove(paths);
    if (storageError) {
      console.error("removing submission files failed", storageError);
    }
  }

  return NextResponse.json({ ok: true });
}
