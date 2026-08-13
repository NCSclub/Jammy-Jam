"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const password = new FormData(event.currentTarget).get("password");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: String(password ?? "") }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "Login failed");
        return;
      }

      /* the cookie is set by the route; refresh so the server component behind
         the destination re-runs its auth check and lets us through. A jury
         password goes straight to the jury room — /admin would only bounce it
         back here. */
      router.replace(body?.role === "jury" ? "/jury" : "/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label htmlFor="password">Staff password</label>
      <div className="password-field">
        <span aria-hidden="true">◆</span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          required
          autoFocus
        />
      </div>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Enter dashboard"}
      </button>
    </form>
  );
}
