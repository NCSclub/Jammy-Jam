import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <main className="admin-login">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <section className="login-card">
        <Image
          className="login-logo"
          src="/brand/jammy-jam-logo.png"
          alt="Jammy Jam"
          width={598}
          height={422}
          priority
        />
        <p className="login-eyebrow">NCS CLUB · ADMIN ACCESS</p>
        <h1>Welcome back</h1>
        <p className="login-copy">
          Enter the event password to manage registrations and participant check-ins.
        </p>
        <LoginForm />
        <Link className="back-link" href="/">← Back to the event website</Link>
      </section>
    </main>
  );
}
