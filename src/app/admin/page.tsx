import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listParticipants } from "@/lib/registrations";
import { Dashboard } from "./dashboard";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  /* rendered on the server so the dashboard opens with data already on screen;
     every change after that goes through /api/registrations */
  const participants = await listParticipants();
  return <Dashboard participants={participants} />;
}
