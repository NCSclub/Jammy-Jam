import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/admin-auth";
import { listCriteria } from "@/lib/criteria";
import { getGradeOutOf } from "@/lib/event-state";
import { listScores } from "@/lib/scores";
import type { Criterion } from "@/lib/judging";
import { ArcadeShell } from "../../games/arcade-parts";
import CriteriaEditor from "./criteria-editor";
import "../jury.css";

export const metadata: Metadata = {
  title: "Judging criteria | Jammy Jam",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where the marking scheme is decided — labels, descriptions and each
 * criterion's own ceiling — before the jury starts scoring.
 *
 * Admin only: whoever can edit the scale can decide the winner, so the shared
 * jury password does not open this page.
 */
export default async function CriteriaPage() {
  const role = await getSessionRole();
  if (!role) redirect("/admin/login");
  if (role !== "admin") redirect("/jury");

  let criteria: Criterion[] = [];
  let gradeOutOf: number | null = null;
  let scoresCount = 0;
  let failed = false;
  try {
    criteria = await listCriteria();
    gradeOutOf = await getGradeOutOf();
    scoresCount = (await listScores()).length;
  } catch {
    failed = true;
  }

  return (
    /* the same Green Hill scene as the hero and the arcade */
    <ArcadeShell sonic>
      <header className="jury-topbar">
        <div><p>JAMMY JAM · ADMIN ONLY</p><h1>Judging Criteria</h1></div>
        <nav>
          <Link href="/jury">Jury room</Link>
          <Link href="/jury/leaderboard">Leaderboard</Link>
          <Link href="/admin">Registrations</Link>
        </nav>
      </header>

      {failed ? (
        <div className="jury-empty">
          <h2>Criteria unavailable</h2>
          <p>Run supabase/jury-scores.sql in the Supabase SQL editor, then refresh.</p>
        </div>
      ) : (
        <CriteriaEditor
          initialCriteria={criteria}
          initialGradeOutOf={gradeOutOf}
          scoresCount={scoresCount}
        />
      )}
    </ArcadeShell>
  );
}
