import { NextResponse } from "next/server";
import { isAdminAuthenticated, UNAUTHORIZED } from "@/lib/admin-auth";
import {
  getSubmissionWindow,
  setSubmissionsClosed,
  setSubmissionWindow,
} from "@/lib/event-state";
import { resolvePhase, windowError } from "@/lib/event-window";

/**
 * GET  /api/admin/arcade — the window, and where we are in it
 * POST /api/admin/arcade — either half of it:
 *   {"closed": true|false}                          the manual switch
 *   {"scheduled": bool, "opensAt": iso|null,
 *    "closesAt": iso|null}                          the schedule
 *
 * Admin only. Closing (by hand or by clock) stops new submissions dead and
 * unlocks the public shelf; reopening reverses both. The dashboard is the only
 * intended caller.
 */

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const window = await getSubmissionWindow();
  return NextResponse.json({
    ...window,
    phase: resolvePhase(window),
    /* the server's now, so the dashboard can show a countdown that does not
       drift with whatever the admin's laptop clock says */
    now: new Date().toISOString(),
  });
}

/** An ISO instant, an explicit null, or nothing at all. */
function readInstant(value: unknown): { ok: true; iso: string | null } | { ok: false } {
  if (value === null || value === undefined || value === "") return { ok: true, iso: null };
  if (typeof value !== "string") return { ok: false };
  const at = Date.parse(value);
  if (Number.isNaN(at)) return { ok: false };
  return { ok: true, iso: new Date(at).toISOString() };
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  /* The schedule branch first: a request carrying `scheduled` is the editor
     saving, and one carrying `closed` is the big button. They write different
     columns, so a request may not be both at once. */
  if (typeof body?.scheduled === "boolean") {
    const opens = readInstant(body.opensAt);
    const closes = readInstant(body.closesAt);
    if (!opens.ok || !closes.ok) {
      return NextResponse.json(
        { error: "Those dates are not valid." },
        { status: 400 },
      );
    }

    const clash = windowError(opens.iso, closes.iso);
    if (clash) return NextResponse.json({ error: clash }, { status: 400 });

    /* A schedule with nothing in it decides nothing — better to say so than to
       quietly leave the doors open under a switch that reads "scheduled". One
       bound is enough, though: "opens at 08:00, closes when I say" is a real
       way to run a jam, and so is the reverse. */
    if (body.scheduled && !opens.iso && !closes.iso) {
      return NextResponse.json(
        { error: "Set an opening or a closing time before scheduling." },
        { status: 400 },
      );
    }

    try {
      await setSubmissionWindow({
        scheduled: body.scheduled,
        opensAt: opens.iso,
        closesAt: closes.iso,
      });
      const window = await getSubmissionWindow();
      return NextResponse.json({ ok: true, ...window, phase: resolvePhase(window) });
    } catch (error) {
      console.error("saving the submission window failed", error);
      return NextResponse.json(
        { error: "Could not save. Run supabase/event-state.sql first." },
        { status: 500 },
      );
    }
  }

  if (typeof body?.closed !== "boolean") {
    return NextResponse.json(
      { error: 'Send {"closed": true|false} or a {"scheduled": …} window.' },
      { status: 400 },
    );
  }

  try {
    await setSubmissionsClosed(body.closed);
    const window = await getSubmissionWindow();
    return NextResponse.json({ ok: true, ...window, phase: resolvePhase(window) });
  } catch (error) {
    console.error("flipping the arcade switch failed", error);
    return NextResponse.json(
      { error: "Could not update. Run supabase/event-state.sql first." },
      { status: 500 },
    );
  }
}
