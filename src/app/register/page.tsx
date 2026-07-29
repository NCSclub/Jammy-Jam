"use client";

import RegistrationForm from "@/components/registration/RegistrationForm";
import { submitRegistration } from "./actions";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#3aa0e0] p-6 sm:p-10">
      <RegistrationForm onSubmit={submitRegistration} />
    </main>
  );
}
