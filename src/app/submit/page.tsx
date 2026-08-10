import type { Metadata } from "next";
import { ArcadeBackdrop } from "../games/arcade-parts";
import SubmissionForm from "./submission-form";

export const metadata: Metadata = {
  title: "Submit your game | Jammy Jam",
  description: "Drop your Jammy Jam build before the deadline.",
};

/* The arcade, out of focus, with the board standing on it: this page is a step
   inside the arcade rather than a different place, and the flat blue field it
   used to sit on said otherwise. */
export default function SubmitPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 sm:p-10">
      <ArcadeBackdrop />
      <div className="relative z-10 flex w-full justify-center">
        <SubmissionForm />
      </div>
    </main>
  );
}
