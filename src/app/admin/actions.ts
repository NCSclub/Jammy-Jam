"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession } from "./auth";

export type LoginState = {
  error?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword || !process.env.ADMIN_SESSION_SECRET) {
    return { error: "Admin access is not configured on this server." };
  }

  if (password !== configuredPassword) {
    return { error: "Incorrect password. Please try again." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logout() {
  await clearAdminSession();
  redirect("/admin/login");
}
