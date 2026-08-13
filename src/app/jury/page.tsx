import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/admin-auth";
import { listSubmissions } from "@/lib/submissions";
import { listScores, type JuryScoreRow } from "@/lib/scores";
import { listCriteria } from "@/lib/criteria";
import { getGradeOutOf } from "@/lib/event-state";
import type { Criterion } from "@/lib/judging";
import { ArcadeShell } from "../games/arcade-parts";
import { JudgeBar, ScorePanel } from "./scoring";
import "./jury.css";

export const dynamic = "force-dynamic";

function fileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export default async function JuryPage() {
  /* jury password or admin password both open this room; only admins also get
     the registrations link below */
  const role = await getSessionRole();
  if (!role) redirect("/admin/login");

  let submissions: Awaited<ReturnType<typeof listSubmissions>> = [];
  let loadError = false;
  try { submissions = await listSubmissions(); } catch { loadError = true; }

  /* Scoring fails soft: a missing jury table must not take down the download
     links — the cards just render without their panels. */
  let criteria: Criterion[] = [];
  let gradeOutOf: number | null = null;
  let scores: JuryScoreRow[] = [];
  try {
    criteria = await listCriteria();
    scores = await listScores();
    gradeOutOf = await getGradeOutOf();
  } catch { /* tables not set up yet */ }

  const scoresFor = (id: string) =>
    scores.filter((score) => score.submission_id === id);

  return (
    /* the hero's world, verbatim: sky, drifting clouds, the Green Hill ground
       with Sonic and Shadow on the grass — the jury room is a room IN the
       site, not a back office bolted onto it */
    <ArcadeShell wide sonic>
      <header className="jury-topbar">
        <div><p>JAMMY JAM · STAFF ONLY</p><h1>Jury Room</h1></div>
        <nav>
          <Link href="/jury/leaderboard">Leaderboard</Link>
          {role === "admin" ? <Link href="/jury/criteria">Criteria</Link> : null}
          {role === "admin" ? <Link href="/admin">Registrations</Link> : null}
          <Link href="/">Event site</Link>
        </nav>
      </header>
      <section className="jury-summary">
        <span>BUILDS RECEIVED</span><strong>{submissions.length}</strong>
      </section>

      {criteria.length === 0 ? (
        <div className="jury-judge" role="alert">
          <label>SCORING NOT SET UP</label>
          <p>
            {role === "admin" ? (
              <>No criteria defined yet — <Link href="/jury/criteria">set up the marking scheme</Link> to open scoring. Downloads work regardless.</>
            ) : (
              <>No criteria defined yet — ask the organizer to set up the marking scheme. Downloads work regardless.</>
            )}
          </p>
        </div>
      ) : (
        <JudgeBar />
      )}

      {loadError ? (
        <div className="jury-empty"><h2>Submission desk isn&apos;t ready</h2><p>Run the included Supabase setup file, then refresh this page.</p></div>
      ) : submissions.length === 0 ? (
        <div className="jury-empty"><h2>No games yet</h2><p>Submitted builds will line up here.</p></div>
      ) : (
        <section className="jury-grid" aria-label="Game submissions">
          {submissions.map((item, index) => (
            <article className="jury-card" key={item.id}>
              {/* the team's own cover art, signed for ten minutes — a plain
                  <img> because next/image cannot optimise a private URL that
                  expires, and would cache a link that has already died */}
              {item.coverUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className="jury-cover" src={item.coverUrl} alt={`${item.game_title} cover`} />
              ) : (
                <div className="jury-cover jury-cover--missing" aria-hidden="true" />
              )}
              <div className="jury-card-body">
                <div className="jury-card-number">{String(index + 1).padStart(2, "0")}</div>
                <p className="jury-team">{item.team_name}</p>
                <h2>{item.game_title}</h2>
                {item.notes ? (
                  <div className="jury-controls"><span>NOTES FROM THE TEAM</span><p>{item.notes}</p></div>
                ) : null}
                <dl>
                  <div><dt>Build</dt><dd>{item.build_name} · {fileSize(item.build_size)}</dd></div>
                </dl>
                <div className="jury-links">
                  {item.buildUrl
                    ? <a className="jury-download" href={item.buildUrl}>Download build ↓</a>
                    : <span className="jury-download disabled">Build unavailable</span>}
                  <Attachment label="Report" href={item.reportUrl} stored={Boolean(item.report_path)} />
                  <Attachment label="Presentation" href={item.deckUrl} stored={Boolean(item.deck_path)} />
                </div>
                {item.other_links?.length ? (
                  <ul className="jury-extra">
                    {item.other_links.map((href) => (
                      <li key={href}>
                        <a href={href} target="_blank" rel="noreferrer">{href}</a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {criteria.length > 0 ? (
                  <ScorePanel
                    submissionId={item.id}
                    criteria={criteria}
                    gradeOutOf={gradeOutOf}
                    initialScores={scoresFor(item.id)}
                  />
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </ArcadeShell>
  );
}

/** A report or deck: a signed download if it was uploaded, otherwise the link
    the team pasted — which is off-site, so it opens in a new tab. */
function Attachment({ label, href, stored }: { label: string; href: string | null; stored: boolean }) {
  if (!href) return <span className="jury-attachment disabled">{label} unavailable</span>;

  return (
    <a
      className="jury-attachment"
      href={href}
      {...(stored ? {} : { target: "_blank", rel: "noreferrer" })}
    >
      {label} {stored ? "↓" : "↗"}
    </a>
  );
}
