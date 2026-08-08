"use client";

import { useState } from "react";
import RegistrationClosed from "@/components/registration/RegistrationClosed";
import RegistrationForm from "@/components/registration/RegistrationForm";
import { submitRegistration } from "@/lib/submit-registration";

/**
 * The standalone /register page's form. A thin client wrapper, because the POST
 * to /api/register has to happen in the browser — the page itself stays a
 * server component so the deadline is still judged by the server clock.
 */
export default function RegistrationPanel() {
  const [closedByServer, setClosedByServer] = useState(false);

  if (closedByServer) return <RegistrationClosed />;

  return (
    <RegistrationForm
      onSubmit={submitRegistration}
      onRegistrationClosed={() => setClosedByServer(true)}
    />
  );
}
