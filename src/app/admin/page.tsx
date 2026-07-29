import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "./auth";
import { listParticipants } from "./actions";
import { Dashboard } from "./dashboard";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const participants = await listParticipants();
  return <Dashboard participants={participants} />;
}
