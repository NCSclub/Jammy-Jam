import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listParticipants } from "@/lib/registrations";
import { getSubmissionWindow } from "@/lib/event-state";
import { Dashboard } from "./dashboard";

/* The window is live state — a cached copy would show yesterday's schedule. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  /* rendered on the server so the dashboard opens with data already on screen;
     every change after that goes through /api/registrations */
  const [participants, submissionWindow] = await Promise.all([
    listParticipants(),
    getSubmissionWindow(),
  ]);
  return (
    <Dashboard participants={participants} submissionWindow={submissionWindow} />
  );
}
