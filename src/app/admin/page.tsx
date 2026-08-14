import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listParticipants } from "@/lib/registrations";
import { getSubmissionWindow } from "@/lib/event-state";
import { listSubmissions } from "@/lib/submissions";
import { Dashboard } from "./dashboard";
import type { AdminSubmission } from "./types";

/* The window is live state — a cached copy would show yesterday's schedule.
   The download links below are signed for ten minutes, which is the other
   reason this page may never be cached: a stored copy would hand out URLs
   that died before anyone clicked them. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  /* rendered on the server so the dashboard opens with data already on screen;
     every change after that goes through /api/registrations */
  const [participants, submissionWindow] = await Promise.all([
    listParticipants(),
    getSubmissionWindow(),
  ]);

  /* The games fail soft, alone among the three: on a database where the
     submissions table was never created, the registration dashboard — which
     has nothing to do with it — must still open. The panel says which of the
     two silences it is looking at. */
  let submissions: AdminSubmission[] = [];
  let submissionsFailed = false;
  try {
    submissions = (await listSubmissions()).map((item) => ({
      id: item.id,
      submittedAt: item.created_at,
      teamName: item.team_name,
      gameTitle: item.game_title,
      notes: item.notes,
      buildName: item.build_name,
      buildSize: item.build_size,
      buildUrl: item.buildUrl,
      reportUrl: item.reportUrl,
      reportStored: Boolean(item.report_path),
      deckUrl: item.deckUrl,
      deckStored: Boolean(item.deck_path),
      otherLinks: item.other_links ?? [],
    }));
  } catch {
    submissionsFailed = true;
  }

  return (
    <Dashboard
      participants={participants}
      submissionWindow={submissionWindow}
      submissions={submissions}
      submissionsFailed={submissionsFailed}
    />
  );
}
