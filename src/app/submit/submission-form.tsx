"use client";

import { useState } from "react";
import Link from "next/link";
import { Press_Start_2P, VT323 } from "next/font/google";
import {
  buildExtension,
  formatBytes,
  MAX_BUILD_SIZE,
} from "@/lib/submission-limits";
/* The whole pixel vocabulary — frame, checker strip, labels, inputs, buttons —
   is the registration form's. Importing it rather than restyling this page
   means the two forms are the same object in two places and cannot drift. */
import "@/components/registration/registration-form.css";
import "./submission.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-pixel",
});

const bodyFont = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-body",
});

type Values = {
  teamName: string;
  gameTitle: string;
  contactEmail: string;
  description: string;
  controls: string;
};

type FieldName = keyof Values | "build";

const EMPTY: Values = {
  teamName: "",
  gameTitle: "",
  contactEmail: "",
  description: "",
  controls: "",
};

/* Mirrors the checks in /api/submissions and the column constraints in
   supabase/submissions-setup.sql, so nothing gets uploaded only to bounce. */
function validate(values: Values, file: File | null) {
  const errors: Partial<Record<FieldName, string>> = {};

  if (!values.teamName.trim()) errors.teamName = "Enter your team name";
  if (!values.gameTitle.trim()) errors.gameTitle = "Name your game";
  if (!values.contactEmail.trim()) errors.contactEmail = "Enter a contact email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim()))
    errors.contactEmail = "That email looks broken";
  if (!values.description.trim()) errors.description = "Describe your game";
  if (!values.controls.trim()) errors.controls = "Explain how to play it";

  if (!file) errors.build = "Choose your game build";
  else if (!buildExtension(file.name))
    errors.build = "Use a .zip, .rar, .7z or .exe";
  else if (file.size > MAX_BUILD_SIZE)
    errors.build = `That build is ${formatBytes(file.size)} — 500 MB max`;

  return errors;
}

async function json(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Something went wrong.");
  return body;
}

/**
 * `fetch` cannot report how far a request body has got, and a 500 MB build on
 * venue wifi is minutes of a frozen button — long enough that people close the
 * tab and submit nothing. XHR still exposes `upload.onprogress`, so this is the
 * one place the old API is the right one.
 */
function upload(url: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error("The build upload failed. Please try again."));
    request.onerror = () =>
      reject(new Error("The upload dropped. Check your connection and retry."));
    request.send(file);
  });
}

export default function SubmissionForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done">(
    "idle",
  );
  const [percent, setPercent] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const busy = status === "uploading" || status === "saving";

  const update =
    (name: keyof Values) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [name]: value }));
      setErrors((current) => {
        if (!current[name]) return current;
        const next = { ...current };
        delete next[name];
        return next;
      });
    };

  function chooseFile(next: File | null) {
    setFile(next);
    setErrors((current) => {
      if (!current.build) return current;
      const rest = { ...current };
      delete rest.build;
      return rest;
    });
  }

  /* Drop anywhere on the zone. Only the first file is taken — a build is one
     archive, and silently uploading the wrong one of several is worse. */
  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) chooseFile(dropped);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values, file);
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`jj-${firstInvalid}`)?.focus();
      return;
    }
    if (!file) return;

    try {
      setPercent(0);
      setStatus("uploading");
      const signed = await json(
        await fetch("/api/submissions/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
        }),
      );

      await upload(signed.uploadUrl, file, setPercent);

      setStatus("saving");
      await json(
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            buildPath: signed.path,
            buildName: file.name,
            buildSize: file.size,
          }),
        }),
      );
      setStatus("done");
    } catch (caught) {
      setStatus("idle");
      setPercent(0);
      setErrors({
        build:
          caught instanceof Error ? caught.message : "Something went wrong.",
      });
    }
  }

  return (
    <div
      className={`jj-form ${pixelFont.variable} ${bodyFont.variable} w-full max-w-2xl`}
    >
      <div className="jj-frame jj-cut p-1">
        <div className="jj-frame__bevel jj-cut p-1">
          <div className="jj-frame__body jj-cut">
            <header className="jj-header px-6 pt-7 pb-8 sm:px-8">
              <h1 className="jj-title text-base sm:text-xl">
                Jammy Jam
                <br />
                <em>Submission</em>
              </h1>
              <p className="jj-hint mt-3">
                &gt; drop your build before the deadline
              </p>
            </header>

            <div className="jj-checker" aria-hidden="true" />

            {status === "done" ? (
              <div className="px-6 py-14 text-center sm:px-8">
                <div className="flex flex-col items-center gap-5">
                  <span className="jj-done__coin" aria-hidden="true" />
                  <p className="jj-done text-sm sm:text-base">Game submitted!</p>
                  <p className="jj-hint max-w-sm">
                    Your build is in. We&apos;ll email {values.contactEmail} if
                    anything is missing. Good luck, player.
                  </p>
                  <Link
                    href="/"
                    className="jj-btn jj-cut jj-cut--sm mt-2 inline-flex items-center justify-center"
                  >
                    Back to the event
                  </Link>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="px-6 py-7 sm:px-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="teamName" label="Team Name" required error={errors.teamName}>
                    <input
                      id="jj-teamName"
                      name="teamName"
                      type="text"
                      maxLength={80}
                      placeholder="Enter your team name"
                      value={values.teamName}
                      onChange={update("teamName")}
                      aria-invalid={Boolean(errors.teamName)}
                      aria-describedby={errors.teamName ? "jj-teamName-error" : undefined}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field name="gameTitle" label="Game Title" required error={errors.gameTitle}>
                    <input
                      id="jj-gameTitle"
                      name="gameTitle"
                      type="text"
                      maxLength={100}
                      placeholder="Enter your game's name"
                      value={values.gameTitle}
                      onChange={update("gameTitle")}
                      aria-invalid={Boolean(errors.gameTitle)}
                      aria-describedby={errors.gameTitle ? "jj-gameTitle-error" : undefined}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>
                </div>

                <div className="mt-5 grid gap-5">
                  <Field
                    name="contactEmail"
                    label="Contact Email"
                    required
                    error={errors.contactEmail}
                  >
                    <input
                      id="jj-contactEmail"
                      name="contactEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="Where we can reach you"
                      value={values.contactEmail}
                      onChange={update("contactEmail")}
                      aria-invalid={Boolean(errors.contactEmail)}
                      aria-describedby={
                        errors.contactEmail ? "jj-contactEmail-error" : undefined
                      }
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field
                    name="description"
                    label="What is your game?"
                    required
                    error={errors.description}
                  >
                    <textarea
                      id="jj-description"
                      name="description"
                      rows={4}
                      maxLength={800}
                      placeholder="A few lines on the idea, the theme and what makes it yours..."
                      value={values.description}
                      onChange={update("description")}
                      aria-invalid={Boolean(errors.description)}
                      aria-describedby={
                        errors.description ? "jj-description-error" : undefined
                      }
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field
                    name="controls"
                    label="How do we play it?"
                    required
                    error={errors.controls}
                  >
                    <textarea
                      id="jj-controls"
                      name="controls"
                      rows={3}
                      maxLength={800}
                      placeholder="Keys, gamepad, anything we need to know to start..."
                      value={values.controls}
                      onChange={update("controls")}
                      aria-invalid={Boolean(errors.controls)}
                      aria-describedby={errors.controls ? "jj-controls-error" : undefined}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field name="build" label="Game Build" required error={errors.build}>
                    <div
                      className={`jj-drop jj-cut jj-cut--sm${file ? " jj-drop--filled" : ""}${
                        dragging ? " jj-drop--over" : ""
                      }`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (!busy) setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                    >
                      <span className="jj-drop__icon" aria-hidden="true" />
                      <span className="jj-drop__name">
                        {file ? file.name : "Drop your build here"}
                      </span>
                      <span className="jj-drop__hint">
                        {file
                          ? `${formatBytes(file.size)} — click to swap`
                          : ".ZIP .RAR .7Z .EXE · 500 MB max"}
                      </span>
                      <input
                        id="jj-build"
                        type="file"
                        disabled={busy}
                        accept=".zip,.rar,.7z,.exe,application/zip,application/x-rar-compressed,application/x-7z-compressed,application/vnd.microsoft.portable-executable"
                        onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                        aria-invalid={Boolean(errors.build)}
                        aria-describedby={errors.build ? "jj-build-error" : undefined}
                      />
                    </div>
                  </Field>

                  {busy ? (
                    <div className="jj-progress-wrap">
                      <div
                        className="jj-progress jj-cut jj-cut--sm"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={status === "saving" ? 100 : percent}
                        aria-label="Upload progress"
                      >
                        <span
                          className="jj-progress__bar"
                          style={{ width: `${status === "saving" ? 100 : percent}%` }}
                        />
                      </div>
                      <p className="jj-progress__label">
                        {status === "saving"
                          ? "Saving submission..."
                          : `Uploading build — ${percent}%`}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="jj-checker mt-8 -mx-6 sm:-mx-8" aria-hidden="true" />

                <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
                  <Link
                    href="/"
                    className="jj-btn jj-btn--ghost jj-cut jj-cut--sm inline-flex items-center justify-center"
                  >
                    Back
                  </Link>
                  <button type="submit" disabled={busy} className="jj-btn jj-cut jj-cut--sm">
                    {busy ? "Sending..." : "Submit game"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  required,
  error,
  children,
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="jj-field flex flex-col gap-2">
      <label className="jj-label" htmlFor={`jj-${name}`}>
        {label}
        {required ? (
          <span className="jj-req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="jj-error" id={`jj-${name}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
