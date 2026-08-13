import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/admin-auth";
import { leaderboard } from "@/lib/scores";
import { type Criterion, scaledTotal } from "@/lib/judging";
import { ArcadeShell } from "../../games/arcade-parts";
import "../jury.css";

export const metadata: Metadata = {
  title: "Leaderboard | Jammy Jam",
  robots: { index: false, follow: false },
};

/* live standings — never cache a snapshot of half the marks */
export const dynamic = "force-dynamic";

/**
 * The standings, ranked by average total under whatever criteria the head
 * judge configured. Staff-side on purpose: winners are announced from the
 * closing-ceremony stage, not leaked by a public URL.
 */
export default async function LeaderboardPage() {
  const role = await getSessionRole();
  if (!role) redirect("/admin/login");

  let criteria: Criterion[] = [];
  let gradeOutOf: number | null = null;
  let entries: Awaited<ReturnType<typeof leaderboard>>["entries"] = [];
  let failed = false;
  try {
    ({ criteria, gradeOutOf, entries } = await leaderboard());
  } catch {
    failed = true;
  }

  /* every total below is shown on the event's grade scale (e.g. /20) */
  const grade = (raw: number) => scaledTotal(raw, criteria, gradeOutOf);
  const scored = entries.filter((entry) => entry.judgeCount > 0);
  const unscored = entries.filter((entry) => entry.judgeCount === 0);
  const podium = scored.slice(0, 3);

  return (
    /* the same Green Hill scene as the hero and the arcade */
    <ArcadeShell wide sonic>
      <header className="jury-topbar">
        <div><p>JAMMY JAM · STAFF ONLY</p><h1>Leaderboard</h1></div>
        <nav>
          <Link href="/jury">Jury room</Link>
          {role === "admin" ? <Link href="/jury/criteria">Criteria</Link> : null}
          {role === "admin" ? <Link href="/admin">Registrations</Link> : null}
          <Link href="/">Event site</Link>
        </nav>
      </header>

      {failed ? (
        <div className="jury-empty">
          <h2>Scores unavailable</h2>
          <p>Run supabase/jury-scores.sql in the Supabase SQL editor, then refresh.</p>
        </div>
      ) : criteria.length === 0 ? (
        <div className="jury-empty">
          <h2>Judging is not set up</h2>
          <p>
            {role === "admin"
              ? "Define the marking scheme at /jury/criteria first."
              : "Ask the organizer to define the marking scheme first."}
          </p>
        </div>
      ) : scored.length === 0 ? (
        <div className="jury-empty">
          <h2>No marks yet</h2>
          <p>Rankings appear as soon as the first judge saves a score in the jury room.</p>
        </div>
      ) : (
        <>
          {/* visual order 2-1-3 comes from CSS; the list itself stays ranked
              so screen readers hear first place first */}
          <ol className="lb-podium">
            {podium.map((entry, index) => (
              <li className={`lb-step lb-step--${index + 1}`} key={entry.submissionId}>
                <span className="lb-step__medal" aria-hidden="true">
                  {["🥇", "🥈", "🥉"][index]}
                </span>
                <span className="lb-step__rank">#{index + 1}</span>
                <strong className="lb-step__team">{entry.teamName}</strong>
                <em className="lb-step__game">{entry.gameTitle}</em>
                <span className="lb-step__score">
                  {grade(entry.averageTotal).value}
                  <small> / {grade(entry.averageTotal).outOf}</small>
                </span>
                <span className="lb-step__judges">
                  {entry.judgeCount} {entry.judgeCount === 1 ? "judge" : "judges"}
                </span>
              </li>
            ))}
          </ol>

          <section className="lb-table" aria-label="Full standings">
            {scored.map((entry, index) => (
              <article className="lb-row" key={entry.submissionId}>
                <span className="lb-row__rank">{index + 1}</span>
                <div className="lb-row__who">
                  <strong>{entry.teamName}</strong>
                  <em>{entry.gameTitle}</em>
                </div>
                <div className="lb-row__bars">
                  {criteria.map((criterion) => (
                    <div className="lb-bar" key={criterion.id}>
                      <span className="lb-bar__label">{criterion.label}</span>
                      <span className="lb-bar__track">
                        <span
                          className="lb-bar__fill"
                          style={{
                            width: `${(entry.averages[criterion.id] / criterion.max) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="lb-bar__value">
                        {entry.averages[criterion.id]}/{criterion.max}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="lb-row__total">
                  <strong>{grade(entry.averageTotal).value}</strong>
                  <small>/ {grade(entry.averageTotal).outOf} · {entry.judgeCount}{" "}
                    {entry.judgeCount === 1 ? "judge" : "judges"}</small>
                  {entry.staleCount > 0 ? (
                    <small className="lb-row__stale">
                      {entry.staleCount} sheet{entry.staleCount === 1 ? "" : "s"} need
                      re-scoring
                    </small>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {unscored.length > 0 ? (
        <section className="lb-unscored" aria-label="Not yet scored">
          <h2>Still waiting for marks</h2>
          <ul>
            {unscored.map((entry) => (
              <li key={entry.submissionId}>
                <strong>{entry.teamName}</strong> — {entry.gameTitle}
                {entry.staleCount > 0
                  ? ` (${entry.staleCount} outdated sheet${entry.staleCount === 1 ? "" : "s"})`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ArcadeShell>
  );
}
