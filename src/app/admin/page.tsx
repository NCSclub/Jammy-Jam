import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listParticipants } from "@/lib/registrations";
import { isSubmissionsClosed } from "@/lib/event-state";
import { Dashboard } from "./dashboard";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  /* rendered on the server so the dashboard opens with data already on screen;
     every change after that goes through /api/registrations */
  const [participants, submissionsClosed] = await Promise.all([
    listParticipants(),
    isSubmissionsClosed(),
  ]);
  return (
    <Dashboard participants={participants} submissionsClosed={submissionsClosed} />
  );
}
