import Link from "next/link";
import "./register-cta.css";

/**
 * Temporary floating REGISTER NOW button.
 *
 * The hero is not built yet, so nothing on the site links to /register and the
 * form is unreachable. This keeps it one click away; drop the component from
 * page.tsx once the hero carries its own button.
 */
export function RegisterCta() {
  return (
    <Link className="jj-cta" href="/register">
      <span className="jj-cta__ring" aria-hidden="true" />
      Register now
    </Link>
  );
}
