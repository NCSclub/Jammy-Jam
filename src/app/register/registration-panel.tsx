"use client";

import RegistrationForm from "@/components/registration/RegistrationForm";
import { submitRegistration } from "@/lib/submit-registration";

/**
 * The standalone /register page's form. A thin client wrapper, because the POST
 * to /api/register has to happen in the browser — the page itself stays a
 * server component so the deadline is still judged by the server clock.
 */
export default function RegistrationPanel() {
  return <RegistrationForm onSubmit={submitRegistration} />;
}
