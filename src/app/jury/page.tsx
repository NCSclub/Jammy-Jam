import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listSubmissions } from "@/lib/submissions";
import "./jury.css";

export const dynamic = "force-dynamic";

function fileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export default async function JuryPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let submissions: Awaited<ReturnType<typeof listSubmissions>> = [];
  let loadError = false;
  try { submissions = await listSubmissions(); } catch { loadError = true; }

  return (
    <main className="jury-page">
      <header className="jury-topbar">
        <div><p>JAMMY JAM · STAFF ONLY</p><h1>Jury Room</h1></div>
        <nav><Link href="/admin">Registrations</Link><Link href="/">Event site</Link></nav>
      </header>
      <section className="jury-summary">
        <span>BUILDS RECEIVED</span><strong>{submissions.length}</strong>
      </section>
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
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
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
