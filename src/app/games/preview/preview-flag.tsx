import Link from "next/link";

/* TEMPORARY — the banner that says none of this is real, plus a switch between
   the two phases of the page. Delete with src/app/games/preview/. */
export default function PreviewFlag({ phase }: { phase: "jam" | "open" }) {
  return (
    <div className="preview-flag">
      <span>Preview · invented games, no database · real page is /games</span>
      <span className="preview-flag__switch">
        <Link
          href="/games/preview"
          aria-current={phase === "jam" ? "page" : undefined}
          className={phase === "jam" ? "is-on" : ""}
        >
          During the jam
        </Link>
        <Link
          href="/games/preview?phase=open"
          aria-current={phase === "open" ? "page" : undefined}
          className={phase === "open" ? "is-on" : ""}
        >
          After the deadline
        </Link>
      </span>
    </div>
  );
}
