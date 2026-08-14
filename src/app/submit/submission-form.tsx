"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Press_Start_2P, VT323 } from "next/font/google";
import {
  ASSETS,
  type AssetKind,
  assetExtension,
  formatBytes,
  isHttpUrl,
  MAX_OTHER_LINKS,
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

type FieldName =
  | "teamName"
  | "gameTitle"
  | "build"
  | "cover"
  | "report"
  | "deck"
  | "notes"
  | "otherLinks";

type Files = Record<AssetKind, File | null>;
type Links = { report: string; deck: string };

const NO_FILES: Files = { build: null, cover: null, report: null, deck: null };

/* The two attachments that may be a link instead of an upload. */
const LINKABLE = ["report", "deck"] as const;
type Linkable = (typeof LINKABLE)[number];

type Progress = { label: string; percent: number; step: number; total: number };

/** Mirrors /api/submissions and the column constraints in the setup SQL. */
function validate(teamName: string, gameTitle: string, files: Files, links: Links) {
  const errors: Partial<Record<FieldName, string>> = {};

  if (!teamName.trim()) errors.teamName = "Enter your team name";
  if (!gameTitle.trim()) errors.gameTitle = "Name your game";

  const coverProblem = checkFile("cover", files.cover);
  if (coverProblem) errors.cover = coverProblem;

  /* The build may be left out entirely — a team can hand in the write-up and
     the deck and still be building the executable. One that IS attached is
     held to the same rules as before: a wrong file is a mistake, not a
     shortcut to submitting without a build. */
  if (files.build) {
    const problem = checkFile("build", files.build);
    if (problem) errors.build = problem;
  }

  for (const kind of LINKABLE) {
    const file = files[kind];
    const link = links[kind].trim();
    if (!file && !link) {
      errors[kind] = "Attach a file or paste a link";
    } else if (file) {
      const problem = checkFile(kind, file);
      if (problem) errors[kind] = problem;
    } else if (!isHttpUrl(link)) {
      errors[kind] = "That link needs to start with https://";
    }
  }

  return errors;
}

function checkFile(kind: AssetKind, file: File | null) {
  if (!file) return `Choose your ${ASSETS[kind].label}`;
  if (!assetExtension(kind, file.name))
    return `Use ${ASSETS[kind].extensions.join(", ")}`;
  /* The only place a size is ever spelled out. The zones stay quiet about the
     caps; you only hear about one when you have actually hit it. */
  if (file.size > ASSETS[kind].maxSize)
    return `Too big. ${formatBytes(ASSETS[kind].maxSize)} max`;
  return null;
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
function put(url: string, file: File, onProgress: (percent: number) => void) {
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
        : reject(new Error("An upload failed. Please try again."));
    request.onerror = () =>
      reject(new Error("The upload dropped. Check your connection and retry."));
    request.send(file);
  });
}

/**
 * "Submissions are open", with the time left when there is a deadline to
 * count to.
 *
 * The page only renders this form when the desk is open, so the strip is never
 * a lie — but a team standing over a 400 MB upload wants to see how long they
 * have, not infer it from the form still being there. Null until the browser
 * has its own clock, for the usual hydration reason.
 */
function OpenStrip({ closesAt }: { closesAt: string | null }) {
  const [left, setLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!closesAt) return;
    const target = Date.parse(closesAt);
    function paint() {
      const diff = Math.max(0, target - Date.now());
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      setLeft(
        diff <= 0
          ? "closing any moment"
          : hours
            ? `${hours}h ${minutes % 60}m left`
            : `${minutes}m left`,
      );
    }
    paint();
    const tick = setInterval(paint, 1000);
    return () => clearInterval(tick);
  }, [closesAt]);

  return (
    <p className="jj-open-strip">
      <span className="jj-open-strip__dot" aria-hidden="true" />
      Submissions are OPEN{left ? ` — ${left}` : ""}
    </p>
  );
}

export default function SubmissionForm({
  closesAt = null,
}: {
  /** The deadline the page resolved, or null when it closes by hand. */
  closesAt?: string | null;
}) {
  const [teamName, setTeamName] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<Files>(NO_FILES);
  const [links, setLinks] = useState<Links>({ report: "", deck: "" });
  /* Starts empty — the section is optional, so it opens as a bare button
     rather than an input already asking to be filled in. */
  const [otherLinks, setOtherLinks] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [progress, setProgress] = useState<Progress | null>(null);

  const busy = status === "sending";

  /**
   * The desk shutting under a form that is already open.
   *
   * The API refuses a late build regardless — this is so a team finds out from
   * a dead button rather than from a 403 after sitting through a 400 MB
   * upload. An upload already in flight is left alone: it was started in time,
   * and killing it mid-transfer would lose a hand-in that is going to land.
   */
  const [shut, setShut] = useState(false);

  useEffect(() => {
    if (!closesAt) return;
    const target = Date.parse(closesAt);
    if (Number.isNaN(target)) return;

    /* Watching the wall clock, not deriving state from props. */
    function check() {
      if (Date.now() >= target) setShut(true);
    }

    check();
    const tick = setInterval(check, 1000);
    return () => clearInterval(tick);
  }, [closesAt]);

  /* Already sending is the exception: that one finishes. */
  const locked = shut && !busy;

  function clearError(name: FieldName) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  /* Choosing a file drops the link for that slot and vice versa: one document,
     one source. Letting both stand is how the jury ends up reading the older
     of two versions. */
  function chooseFile(kind: AssetKind, file: File | null) {
    setFiles((current) => ({ ...current, [kind]: file }));
    if (file && (kind === "report" || kind === "deck")) {
      setLinks((current) => ({ ...current, [kind]: "" }));
    }
    clearError(kind);
  }

  function changeLink(kind: Linkable, value: string) {
    setLinks((current) => ({ ...current, [kind]: value }));
    if (value) setFiles((current) => ({ ...current, [kind]: null }));
    clearError(kind);
  }

  function changeOtherLink(index: number, value: string) {
    setOtherLinks((current) =>
      current.map((link, at) => (at === index ? value : link)),
    );
    clearError("otherLinks");
  }

  function removeOtherLink(index: number) {
    setOtherLinks((current) => current.filter((_, at) => at !== index));
    clearError("otherLinks");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* Enter in a text field submits a form whatever its button says. */
    if (locked) return;

    const nextErrors = validate(teamName, gameTitle, files, links);

    /* Rows left blank are just an unused slot, not a mistake — they get dropped
       below. Only something typed and wrong is worth stopping for. */
    const extras = otherLinks.map((link) => link.trim()).filter(Boolean);
    if (extras.some((link) => !isHttpUrl(link))) {
      nextErrors.otherLinks = "Every extra link needs to start with https://";
    }

    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`jj-${firstInvalid}`)?.focus();
      return;
    }

    /* Only the slots that actually hold a file get uploaded — report and deck
       may be links, and a link costs nothing to send. */
    const queue = (Object.keys(ASSETS) as AssetKind[])
      .map((kind) => ({ kind, file: files[kind] }))
      .filter((item): item is { kind: AssetKind; file: File } => Boolean(item.file));

    setStatus("sending");
    try {
      const stored: Partial<Record<AssetKind, { path: string; name: string; size: number }>> = {};

      for (const [index, { kind, file }] of queue.entries()) {
        setProgress({
          label: ASSETS[kind].label,
          percent: 0,
          step: index + 1,
          total: queue.length,
        });

        const signed = await json(
          await fetch("/api/submissions/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind, fileName: file.name, fileSize: file.size }),
          }),
        );

        await put(signed.uploadUrl, file, (percent) =>
          setProgress((current) => (current ? { ...current, percent } : current)),
        );

        stored[kind] = { path: signed.path, name: file.name, size: file.size };
      }

      setProgress({ label: "submission", percent: 100, step: queue.length, total: queue.length });
      /* the response carries the new row's slug; nothing on this screen needs
         it any more, but the call still has to succeed before "done" */
      await json(
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamName,
            gameTitle,
            notes,
            build: stored.build,
            cover: stored.cover,
            report: stored.report,
            deck: stored.deck,
            reportUrl: links.report.trim(),
            deckUrl: links.deck.trim(),
            otherLinks: extras,
          }),
        }),
      );
      setStatus("done");
    } catch (caught) {
      setStatus("idle");
      setProgress(null);
      setErrors({
        notes: caught instanceof Error ? caught.message : "Something went wrong.",
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
            {/* deep bottom padding keeps Sonic's head clear of the subtitle —
                he stands 41px above the checker strip */}
            <header className="jj-header px-6 pt-7 pb-16 sm:px-8">
              {/* the way back out: this board covers the whole screen, so
                  without it the only exit is the browser's back button */}
              <Link href="/games" className="jj-close" aria-label="Close">
                <span aria-hidden="true">✕</span>
              </Link>
              <h1 className="jj-title text-base sm:text-xl">
                Jammy Jam
                <br />
                <em>Submission</em>
              </h1>
              <p className="jj-hint mt-3">
                &gt; drop your build before the deadline
              </p>
              {/* Hidden on the success board — a team that has just handed in
                  does not need a deadline any more. */}
              {status === "done" ? null : shut ? (
                <p className="jj-open-strip jj-open-strip--shut" role="status">
                  <span className="jj-open-strip__dot" aria-hidden="true" />
                  Submissions are CLOSED
                </p>
              ) : (
                <OpenStrip closesAt={closesAt} />
              )}
            </header>

            {/* Same finish-line strip and runner as the registration form: he
                jogs in from the left, parks, says hi, then dashes off the right.
                --jj-stop is where he parks — the registration value is measured
                to that form's LAST NAME asterisk, which does not exist here, so
                this page puts him just right of centre instead. */}
            <div
              className="jj-track"
              aria-hidden="true"
              style={{ "--jj-stop": "calc(50% + 110px)" } as CSSProperties}
            >
              <div className="jj-checker" />
              <div className="jj-runner">
                <span className="jj-runner__bubble">Hey again!</span>
                <span className="jj-runner__sprite" />
              </div>
            </div>

            {status === "done" ? (
              <div className="px-6 py-14 text-center sm:px-8">
                <div className="flex flex-col items-center gap-5">
                  <span className="jj-done__coin" aria-hidden="true" />
                  <p className="jj-done text-sm sm:text-base">Game submitted!</p>
                  <p className="jj-hint max-w-sm">
                    {gameTitle} is in, with everything attached. It sits with
                    everyone else&apos;s now, blurred out until the jam ends.
                    Good luck, player.
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    {/* The shelf, not the team's own page: that page 404s until
                        the deadline, so sending a team straight to it the second
                        they submit was a dead end. */}
                    <Link
                      href="/games/shelf"
                      className="jj-btn jj-cut jj-cut--sm inline-flex items-center justify-center"
                    >
                      See other games
                    </Link>
                    <Link
                      href="/games"
                      className="jj-btn jj-btn--ghost jj-cut jj-cut--sm inline-flex items-center justify-center"
                    >
                      Back to the arcade
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="px-6 py-7 sm:px-8">
                <div className="grid gap-6">
                  <Field name="teamName" label="Team name" required error={errors.teamName}>
                    <input
                      id="jj-teamName"
                      name="teamName"
                      type="text"
                      maxLength={80}
                      placeholder="Enter your team name"
                      value={teamName}
                      onChange={(event) => {
                        setTeamName(event.target.value);
                        clearError("teamName");
                      }}
                      aria-invalid={Boolean(errors.teamName)}
                      aria-describedby={errors.teamName ? "jj-teamName-error" : undefined}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field name="gameTitle" label="Name of your game" required error={errors.gameTitle}>
                    <input
                      id="jj-gameTitle"
                      name="gameTitle"
                      type="text"
                      maxLength={100}
                      placeholder="Enter your game's name"
                      value={gameTitle}
                      onChange={(event) => {
                        setGameTitle(event.target.value);
                        clearError("gameTitle");
                      }}
                      aria-invalid={Boolean(errors.gameTitle)}
                      aria-describedby={errors.gameTitle ? "jj-gameTitle-error" : undefined}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field
                    name="build"
                    label="The zip folder, executable inside"
                    error={errors.build}
                  >
                    <Drop
                      kind="build"
                      file={files.build}
                      busy={busy}
                      invalid={Boolean(errors.build)}
                      onChoose={chooseFile}
                      idle="Drop your build here"
                    />
                    <p className="jj-drop-note">
                      If your game is over 500 MB, put the zip folder on the
                      drive instead.
                    </p>
                  </Field>

                  {/* Sits with the build, not at the bottom of the form: this is
                      the text printed on the game's card in the arcade, so it
                      belongs next to the thing it describes rather than in the
                      afterthought slot the old "anything to add" field had. */}
                  <Field
                    name="notes"
                    label="A short description, for other players"
                    error={errors.notes}
                  >
                    <textarea
                      id="jj-notes"
                      name="notes"
                      rows={3}
                      maxLength={800}
                      placeholder="Two or three lines about your game. Everyone will read this on your card in the arcade."
                      value={notes}
                      onChange={(event) => {
                        setNotes(event.target.value);
                        clearError("notes");
                      }}
                      aria-invalid={Boolean(errors.notes)}
                      aria-describedby={errors.notes ? "jj-notes-error" : undefined}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field
                    name="cover"
                    label="One screenshot, for the cover"
                    required
                    error={errors.cover}
                  >
                    <Drop
                      kind="cover"
                      file={files.cover}
                      busy={busy}
                      invalid={Boolean(errors.cover)}
                      onChoose={chooseFile}
                      idle="Drop your cover screenshot"
                      preview
                    />
                  </Field>

                  <Field name="report" label="The report" required error={errors.report}>
                    <FileOrLink
                      kind="report"
                      file={files.report}
                      link={links.report}
                      busy={busy}
                      invalid={Boolean(errors.report)}
                      onChoose={chooseFile}
                      onLink={changeLink}
                      idle="Drop your report"
                      placeholder="https://... (Docs, Drive, PDF)"
                    />
                  </Field>

                  <Field name="deck" label="The presentation" required error={errors.deck}>
                    <FileOrLink
                      kind="deck"
                      file={files.deck}
                      link={links.deck}
                      busy={busy}
                      invalid={Boolean(errors.deck)}
                      onChoose={chooseFile}
                      onLink={changeLink}
                      idle="Drop your presentation"
                      placeholder="https://... (Canva, Slides, PDF)"
                    />
                  </Field>

                  <Field name="otherLinks" label="Other links (optional)" error={errors.otherLinks}>
                    <div className="jj-extra">
                      {otherLinks.map((value, index) => (
                        <div className="jj-extra__row" key={index}>
                          <input
                            id={index === 0 ? "jj-otherLinks" : undefined}
                            type="url"
                            inputMode="url"
                            disabled={busy}
                            placeholder="https://..."
                            value={value}
                            onChange={(event) => changeOtherLink(index, event.target.value)}
                            aria-label={`Extra link ${index + 1}`}
                            className="jj-input jj-cut jj-cut--sm"
                          />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => removeOtherLink(index)}
                            className="jj-extra__remove jj-cut jj-cut--sm"
                            aria-label={`Remove extra link ${index + 1}`}
                          >
                            X
                          </button>
                        </div>
                      ))}

                      {otherLinks.length < MAX_OTHER_LINKS ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setOtherLinks((current) => [...current, ""])}
                          className="jj-extra__add jj-cut jj-cut--sm"
                        >
                          + Add link
                        </button>
                      ) : null}

                      <p className="jj-squad__note">
                        Anything else you want us to see: Figma, a demo video,
                        a devlog, the live build.
                      </p>
                    </div>
                  </Field>

                  {progress ? (
                    <div className="jj-progress-wrap">
                      <div
                        className="jj-progress jj-cut jj-cut--sm"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress.percent}
                        aria-label="Upload progress"
                      >
                        <span
                          className="jj-progress__bar"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <p className="jj-progress__label">
                        {progress.label === "submission"
                          ? "Saving submission..."
                          : `${progress.step}/${progress.total} uploading ${progress.label} ${progress.percent}%`}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="jj-checker mt-8 -mx-6 sm:-mx-8" aria-hidden="true" />

                <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
                  <Link
                    href="/games"
                    className="jj-btn jj-btn--ghost jj-cut jj-cut--sm inline-flex items-center justify-center"
                  >
                    Back
                  </Link>
                  <button
                    type="submit"
                    disabled={busy || locked}
                    className="jj-btn jj-cut jj-cut--sm"
                  >
                    {busy ? "Sending..." : locked ? "Submissions closed" : "Submit game"}
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

/* -------------------------------------------------------------------------- */

/** A drop zone: click it, or drag a file onto it. */
function Drop({
  kind,
  file,
  busy,
  invalid,
  onChoose,
  idle,
  preview,
}: {
  kind: AssetKind;
  file: File | null;
  busy: boolean;
  invalid: boolean;
  onChoose: (kind: AssetKind, file: File | null) => void;
  idle: string;
  preview?: boolean;
}) {
  const [dragging, setDragging] = useState(false);

  const thumbnail = useMemo(
    () => (preview && file ? URL.createObjectURL(file) : null),
    [preview, file],
  );

  /* An object URL is held by the document until it is revoked, so the previous
     one is released the moment a new file replaces it rather than at unload.
     Cleanup is all this effect does — the URL itself is derived above, not
     pushed into state, which would re-render for a value we already have. */
  useEffect(() => {
    if (!thumbnail) return;
    return () => URL.revokeObjectURL(thumbnail);
  }, [thumbnail]);

  return (
    <div
      className={[
        "jj-drop jj-cut jj-cut--sm",
        file ? "jj-drop--filled" : "",
        dragging ? "jj-drop--over" : "",
        invalid ? "jj-drop--invalid" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (busy) return;
        /* only the first file — an attachment is one document, and silently
           taking the wrong one of several is worse than taking none */
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) onChoose(kind, dropped);
      }}
    >
      {thumbnail ? (
        /* eslint-disable-next-line @next/next/no-img-element -- a local object
           URL; next/image cannot optimise a blob that never leaves the tab */
        <img className="jj-drop__thumb" src={thumbnail} alt="" />
      ) : (
        <span className="jj-drop__icon" aria-hidden="true" />
      )}
      <span className="jj-drop__name">{file ? file.name : idle}</span>
      {/* nothing under an empty zone — the accepted formats are already on the
          file picker, and a line of extensions in every one of the four zones
          was more noise than help */}
      {file ? <span className="jj-drop__hint">click to swap</span> : null}
      <input
        id={`jj-${kind}`}
        type="file"
        disabled={busy}
        accept={ASSETS[kind].accept}
        onChange={(event) => onChoose(kind, event.target.files?.[0] ?? null)}
        aria-invalid={invalid}
        aria-describedby={invalid ? `jj-${kind}-error` : undefined}
        aria-label={`Choose your ${ASSETS[kind].label}`}
      />
    </div>
  );
}

/** Upload it, or paste a link to it — whichever the team has. */
function FileOrLink({
  kind,
  file,
  link,
  busy,
  invalid,
  onChoose,
  onLink,
  idle,
  placeholder,
}: {
  kind: Linkable;
  file: File | null;
  link: string;
  busy: boolean;
  invalid: boolean;
  onChoose: (kind: AssetKind, file: File | null) => void;
  onLink: (kind: Linkable, value: string) => void;
  idle: string;
  placeholder: string;
}) {
  return (
    <div className="jj-either">
      <Drop
        kind={kind}
        file={file}
        busy={busy}
        invalid={invalid && !link}
        onChoose={onChoose}
        idle={idle}
      />
      <span className="jj-either__or" aria-hidden="true">
        or
      </span>
      <input
        type="url"
        inputMode="url"
        disabled={busy}
        placeholder={placeholder}
        value={link}
        onChange={(event) => onLink(kind, event.target.value)}
        aria-invalid={invalid && !file}
        aria-label={`Link to your ${ASSETS[kind].label}`}
        className="jj-input jj-cut jj-cut--sm"
      />
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
