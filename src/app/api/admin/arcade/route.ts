import { NextResponse } from "next/server";
import { isAdminAuthenticated, UNAUTHORIZED } from "@/lib/admin-auth";
import { isSubmissionsClosed, setSubmissionsClosed } from "@/lib/event-state";

/**
 * GET  /api/admin/arcade — the switch's current position
 * POST /api/admin/arcade — flip it: {"closed": true | false}
 *
 * Admin only. `closed: true` stops new submissions dead and unlocks the
 * public shelf; `false` reverses both. The dashboard's toggle is the only
 * intended caller.
 */

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  return NextResponse.json({ closed: await isSubmissionsClosed() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.closed !== "boolean") {
    return NextResponse.json(
      { error: 'Send {"closed": true} or {"closed": false}.' },
      { status: 400 },
    );
  }

  try {
    await setSubmissionsClosed(body.closed);
    return NextResponse.json({ ok: true, closed: body.closed });
  } catch (error) {
    console.error("flipping the arcade switch failed", error);
    return NextResponse.json(
      { error: "Could not update. Run supabase/event-state.sql first." },
      { status: 500 },
    );
  }
}
