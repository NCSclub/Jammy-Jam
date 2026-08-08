import type { RegistrationValues } from "@/components/registration/RegistrationForm";

export class RegistrationClosedError extends Error {
  constructor() {
    super("Registrations are closed");
    this.name = "RegistrationClosedError";
  }
}

/**
 * Client-side POST to the public sign-up endpoint. Throws with the server's own
 * message so the form can show "This email is already registered" rather than a
 * generic failure — RegistrationForm catches it and prints it under the field.
 */
export async function submitRegistration(values: RegistrationValues) {
  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 403 && body?.error === "Registrations are closed") {
      throw new RegistrationClosedError();
    }
    throw new Error(body?.error ?? "Could not save your registration, try again");
  }
}
