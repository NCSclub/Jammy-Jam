import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  /* already signed in — go where the session's role allows */
  const role = await getSessionRole();
  if (role === "admin") redirect("/admin");
  if (role === "jury") redirect("/jury");

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
        <p className="login-eyebrow">NCS CLUB · STAFF ACCESS</p>
        <h1>Welcome back</h1>
        <p className="login-copy">
          Enter your staff password. Admins land on the dashboard, jury members
          in the jury room.
        </p>
        <LoginForm />
        <Link className="back-link" href="/">← Back to the event website</Link>
      </section>
    </main>
  );
}
