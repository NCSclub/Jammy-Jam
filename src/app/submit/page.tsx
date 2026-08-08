import type { Metadata } from "next";
import SubmissionForm from "./submission-form";

export const metadata: Metadata = {
  title: "Submit your game | Jammy Jam",
  description: "Drop your Jammy Jam build before the deadline.",
};

/* Same shell as /register — one sky-blue field, the pixel board centred on it. */
export default function SubmitPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#3aa0e0] p-6 sm:p-10">
      <SubmissionForm />
    </main>
  );
}
