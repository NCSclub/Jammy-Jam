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
              <div className="jury-card-number">{String(index + 1).padStart(2, "0")}</div>
              <p className="jury-team">{item.team_name}</p>
              <h2>{item.game_title}</h2>
              <p className="jury-description">{item.description}</p>
              <div className="jury-controls"><span>HOW TO PLAY</span><p>{item.controls}</p></div>
              <dl><div><dt>Contact</dt><dd>{item.contact_email}</dd></div><div><dt>Build</dt><dd>{item.build_name} · {fileSize(item.build_size)}</dd></div></dl>
              {item.downloadUrl ? <a className="jury-download" href={item.downloadUrl}>Download build ↓</a> : <span className="jury-download disabled">Build unavailable</span>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
