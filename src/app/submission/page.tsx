import type { Metadata } from "next";
import Link from "next/link";
import SubmissionForm from "./submission-form";
import "./submission.css";

export const metadata: Metadata = {
  title: "Game Submission | Jammy Jam",
  description: "Submit your Jammy Jam game build.",
};

export default function SubmissionPage() {
  return (
    <main className="submission-page">
      <div className="submission-sky" aria-hidden="true" />
      <Link className="submission-back" href="/">← Back to Jammy Jam</Link>
      <SubmissionForm />
    </main>
  );
}
