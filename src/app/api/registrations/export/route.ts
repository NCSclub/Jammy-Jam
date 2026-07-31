import { NextResponse } from "next/server";
import { isAdminAuthenticated, UNAUTHORIZED } from "@/lib/admin-auth";
import { exportRows } from "@/lib/registrations";

/**
 * GET /api/registrations/export — every column, as a CSV download.
 *
 * The file is built here rather than in the browser so the client never has to
 * hold the full table just to save it, and the BOM keeps Excel from mangling
 * accented names.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }

  try {
    const rows = await exportRows();
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition":
          'attachment; filename="jammy-jam-registrations.csv"',
      },
    });
  } catch (error) {
    console.error("csv export failed", error);
    return NextResponse.json({ error: "Could not build the export" }, { status: 500 });
  }
}
