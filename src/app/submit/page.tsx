import type { Metadata } from "next";
import { getSubmissionWindow } from "@/lib/event-state";
import { nextBoundary, resolvePhase } from "@/lib/event-window";
import { ArcadeBackdrop } from "../games/arcade-parts";
import SubmissionForm from "./submission-form";
import SubmissionClosed from "./submission-closed";

export const metadata: Metadata = {
  title: "Submit your game | Jammy Jam",
  description: "Drop your Jammy Jam build before the deadline.",
};

/* The doors can move between two visitors, so this page may never be cached. */
export const dynamic = "force-dynamic";

/* The arcade, out of focus, with the board standing on it: this page is a step
   inside the arcade rather than a different place, and the flat blue field it
   used to sit on said otherwise. */
export default async function SubmitPage() {
  /* The API refuses a late build either way. This is so a team finds out
     BEFORE filling the form in and sitting through a 400 MB upload, which is
     the worst possible moment to learn the desk is shut. */
  const submissionWindow = await getSubmissionWindow();
  const phase = resolvePhase(submissionWindow);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 sm:p-10">
      <ArcadeBackdrop />
      <div className="relative z-10 flex w-full justify-center">
        {phase === "open" ? (
          <SubmissionForm closesAt={nextBoundary(submissionWindow)} />
        ) : (
          <SubmissionClosed phase={phase} opensAt={submissionWindow.opensAt} />
        )}
      </div>
    </main>
  );
}
