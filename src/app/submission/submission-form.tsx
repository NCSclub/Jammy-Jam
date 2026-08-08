"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "uploading" | "saving" | "done";

async function json(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Something went wrong.");
  return body;
}

export default function SubmissionForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError("Choose your game build first.");
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      setStatus("uploading");
      const signed = await json(await fetch("/api/submissions/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
      }));

      const uploaded = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploaded.ok) throw new Error("The build upload failed. Please try again.");

      setStatus("saving");
      await json(await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: form.get("teamName"), gameTitle: form.get("gameTitle"),
          contactEmail: form.get("contactEmail"), description: form.get("description"),
          controls: form.get("controls"), buildPath: signed.path,
          buildName: file.name, buildSize: file.size,
        }),
      }));
      setStatus("done");
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <section className="submission-card submission-done">
        <span className="submission-coin" aria-hidden="true" />
        <p className="submission-kicker">UPLOAD COMPLETE</p>
        <h1>Game submitted!</h1>
        <p>Your build is with the jury. Good luck, player.</p>
        <Link className="submission-button" href="/">Back to the event</Link>
      </section>
    );
  }

  return (
    <section className="submission-card">
      <header className="submission-header">
        <p className="submission-kicker">FINAL CHECKPOINT</p>
        <h1>Submit your game</h1>
        <p>Package the playable build, add the essentials, and send it to the jury.</p>
      </header>
      <div className="submission-checker" />
      <form onSubmit={submit} className="submission-form">
        <div className="submission-grid">
          <label>Team name<input name="teamName" required maxLength={80} /></label>
          <label>Game title<input name="gameTitle" required maxLength={100} /></label>
        </div>
        <label>Contact email<input name="contactEmail" type="email" required /></label>
        <label>Short game description<textarea name="description" required maxLength={800} rows={4} /></label>
        <label>Controls / how to play<textarea name="controls" required maxLength={800} rows={4} /></label>
        <label className="submission-drop">
          <span>{file ? file.name : "Choose your game build"}</span>
          <small>.ZIP, .RAR, .7Z or .EXE · 500 MB max</small>
          <input
            type="file"
            accept=".zip,.rar,.7z,.exe,application/zip,application/x-rar-compressed,application/x-7z-compressed,application/vnd.microsoft.portable-executable"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </label>
        {error ? <p className="submission-error" role="alert">{error}</p> : null}
        <button className="submission-button" disabled={status !== "idle"}>
          {status === "uploading" ? "Uploading build..." : status === "saving" ? "Saving..." : "Submit game"}
        </button>
      </form>
    </section>
  );
}
