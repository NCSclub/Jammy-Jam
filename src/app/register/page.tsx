import RegistrationClosed from "@/components/registration/RegistrationClosed";
import RegistrationPanel from "./registration-panel";
import { formatDeadline, isRegistrationOpen } from "@/config/site";

/* server component: the cutoff is decided by the server clock, not the
   visitor's, so nobody gets in late by changing their system time */
export default function RegisterPage() {
  const open = isRegistrationOpen();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#3aa0e0] p-6 sm:p-10">
      {open ? <RegistrationPanel /> : <RegistrationClosed deadline={formatDeadline()} />}
    </main>
  );
}
