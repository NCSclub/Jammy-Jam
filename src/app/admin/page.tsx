import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "./auth";
import { Dashboard } from "./dashboard";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <Dashboard />;
}
