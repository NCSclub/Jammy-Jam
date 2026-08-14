"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/submission-limits";
import type { AdminSubmission } from "./types";

/**
 * What has actually come in, on the dashboard.
 *
 * The jury room shows the same games as cards to be judged. This is the other
 * question, the one asked in the last ten minutes before the desk shuts: who
 * has handed in, and who has not. So it is a register, not a gallery — one
 * line per team, newest first, with the files hanging off the end of the row.
 */

/** Algiers, always: the organizer reading this is in the room. */
function submittedTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Algiers",
  });
}

function submittedFull(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Algiers",
  });
}

/* Team names are typed twice — once at sign-up, once on the submission form —
   and the two are never quite the same string. Accents, case, punctuation and
   spacing all collapse so "Les Bg's" and "les bgs" are one team. Word order is
   left alone, unlike the participant matcher: a team name is a name, and
   "Pixel Storm" and "Storm Pixel" are two different squads. */
function teamKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function SubmissionsPanel({
  submissions,
  failed,
  teamNames,
}: {
  submissions: AdminSubmission[];
  /** The table could not be read — never the same thing as "nobody has sent". */
  failed: boolean;
  /** Every team on the registration list, to answer "who is missing?". */
  teamNames: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showMissing, setShowMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The row being deleted, so only its own button says "Deleting…". */
  const [busyId, setBusyId] = useState<string | null>(null);

  /* Two barriers, because this one cannot be undone and the rows it sits on
     are teams' entire jams: the game's own title has to be in the sentence,
     so a misaimed click is a click on a name you did not mean to read. */
  function remove(item: AdminSubmission) {
    const sure = window.confirm(
      `Delete "${item.gameTitle}" by ${item.teamName}?\n\n` +
        "The entry, its files and any scores the jury has given it are erased " +
        "for good. There is no undo.",
    );
    if (!sure) return;

    setError(null);
    setBusyId(item.id);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/submissions/${item.id}`, {
          method: "DELETE",
        });
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Could not delete that game.");
        }
        /* The server component owns this list, so a refetch is what makes the
           row disappear — and it re-signs every other download link too. */
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not delete that game.");
      } finally {
        setBusyId(null);
      }
    });
  }

  /* A registered team with no submission carrying its name. Matched on the
     name alone, which is why the panel says so out loud below: a team that
     typed something different on the form lands here wrongly, and chasing the
     wrong squad at 11:40 is worse than not chasing one. */
  const missing = useMemo(() => {
    const handedIn = new Set(submissions.map((item) => teamKey(item.teamName)));
    return teamNames
      .filter((name) => name.trim() && !handedIn.has(teamKey(name)))
      .sort((a, b) => a.localeCompare(b));
  }, [submissions, teamNames]);

  return (
    <section className="night-panel" aria-label="Submissions received">
      <div className="panel-title">
        <div>
          <p className="section-kicker">THE HAND-IN</p>
          <h2>◷ Games received</h2>
        </div>
        <div className="subs-head-actions">
          <span className="subs-count">
            <strong>{submissions.length}</strong>{" "}
            {submissions.length === 1 ? "game" : "games"} in
          </span>
          {/* Nothing to forward: the jury room reads the same table, so a game
              is in front of the judges the second a team submits it. This is
              the way through to score them. */}
          <Link className="night-column__view subs-jury" href="/jury">
            Score them in the jury room ↗
          </Link>
        </div>
      </div>

      {error ? (
        <p className="subs-error" role="alert">
          {error}
        </p>
      ) : null}

      {failed ? (
        <p className="subs-empty" role="alert">
          The submissions table could not be read. Run the Supabase setup file,
          then refresh — this is not the same as nobody having handed in.
        </p>
      ) : submissions.length === 0 ? (
        <p className="subs-empty">
          Nothing handed in yet. Games appear here the moment a team submits.
        </p>
      ) : (
        <ul className="subs-list">
          {submissions.map((item) => (
            <li className="subs-row" key={item.id}>
              <div className="subs-when" title={submittedFull(item.submittedAt)}>
                {submittedTime(item.submittedAt)}
              </div>

              <div className="subs-who">
                <p className="subs-team">{item.teamName}</p>
                <h3>{item.gameTitle}</h3>
                {item.notes ? <p className="subs-note">{item.notes}</p> : null}
              </div>

              <div className="subs-files">
                {item.buildUrl ? (
                  <a className="subs-file" href={item.buildUrl}>
                    Build ↓
                    <small>
                      {item.buildSize === null
                        ? item.buildName
                        : formatBytes(item.buildSize)}
                    </small>
                  </a>
                ) : (
                  /* A build that exists but would not sign is a fault; one that
                     was never sent is the team's own call, and an organizer
                     needs to tell those two apart before ringing anyone. */
                  <span className="subs-file is-off">
                    {item.buildName ? "Build unavailable" : "No build"}
                  </span>
                )}

                <FileLink label="Report" href={item.reportUrl} stored={item.reportStored} />
                <FileLink label="Deck" href={item.deckUrl} stored={item.deckStored} />

                {item.otherLinks.map((href) => (
                  <a
                    className="subs-file subs-file--extra"
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    title={href}
                  >
                    Link ↗
                  </a>
                ))}

                <button
                  className="subs-file subs-delete"
                  disabled={pending && busyId === item.id}
                  onClick={() => remove(item)}
                  title={`Delete ${item.gameTitle}`}
                >
                  {pending && busyId === item.id ? "Deleting…" : "Delete ✕"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Only worth showing once something has come in — before that, "missing"
          is every team on the list and says nothing. */}
      {!failed && submissions.length > 0 && missing.length > 0 ? (
        <div className="subs-missing">
          <button
            className="night-column__view"
            onClick={() => setShowMissing((open) => !open)}
          >
            {showMissing ? "▾" : "▸"} {missing.length} registered{" "}
            {missing.length === 1 ? "team has" : "teams have"} nothing in yet
          </button>
          {showMissing ? (
            <>
              <ul>
                {missing.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <p>
                Matched on team name, so a squad that typed theirs differently on
                the form shows up here anyway. Check the list above before
                chasing anyone.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** The report or the deck: a signed download when it was uploaded, otherwise
    the link the team pasted — which is off-site, so it opens in a new tab. */
function FileLink({
  label,
  href,
  stored,
}: {
  label: string;
  href: string | null;
  stored: boolean;
}) {
  if (!href) return <span className="subs-file is-off">No {label.toLowerCase()}</span>;

  return (
    <a
      className="subs-file"
      href={href}
      {...(stored ? {} : { target: "_blank", rel: "noreferrer" })}
    >
      {label} {stored ? "↓" : "↗"}
    </a>
  );
}
