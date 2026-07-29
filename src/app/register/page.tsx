import RegistrationForm from "@/components/registration/RegistrationForm";
import RegistrationClosed from "@/components/registration/RegistrationClosed";
import { formatDeadline, isRegistrationOpen } from "@/lib/registration-window";
import { submitRegistration } from "./actions";

/* server component: the cutoff is decided by the server clock, not the
   visitor's, so nobody gets in late by changing their system time */
export default function RegisterPage() {
  const open = isRegistrationOpen();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#3aa0e0] p-6 sm:p-10">
      {open ? (
        <RegistrationForm onSubmit={submitRegistration} />
      ) : (
        <RegistrationClosed deadline={formatDeadline()} />
      )}
    </main>
  );
}
