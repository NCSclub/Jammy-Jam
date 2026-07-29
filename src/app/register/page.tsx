"use client";

import RegistrationForm from "@/components/RegistrationForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#3aa0e0] p-6 sm:p-10">
      <RegistrationForm onSubmit={(values) => console.log(values)} />
    </main>
  );
}
