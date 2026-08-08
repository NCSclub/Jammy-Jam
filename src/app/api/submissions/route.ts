import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  ASSETS,
  type AssetKind,
  assetExtension,
  isHttpUrl,
  MAX_OTHER_LINKS,
  SUBMISSIONS_BUCKET,
} from "@/lib/submissions";

type Attachment = { path: string; name: string; size: number };

/** Reads the {path, name, size} trio the form sends for one uploaded file. */
function readAttachment(value: unknown): Attachment | null {
  if (!value || typeof value !== "object") return null;
  const { path, name, size } = value as Record<string, unknown>;
  if (typeof path !== "string" || !path) return null;
  if (typeof name !== "string" || !name) return null;
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  return { path, name, size: bytes };
}

function invalidAttachment(kind: AssetKind, file: Attachment | null) {
  if (!file) return true;
  if (!file.path.startsWith(`${ASSETS[kind].folder}/`)) return true;
  if (!assetExtension(kind, file.name)) return true;
  return file.size > ASSETS[kind].maxSize;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const teamName = String(body?.teamName ?? "").trim();
  const gameTitle = String(body?.gameTitle ?? "").trim();
  const notes = String(body?.notes ?? "").trim();

  const build = readAttachment(body?.build);
  const cover = readAttachment(body?.cover);
  const report = readAttachment(body?.report);
  const deck = readAttachment(body?.deck);
  const reportUrl = String(body?.reportUrl ?? "").trim();
  const deckUrl = String(body?.deckUrl ?? "").trim();

  /* Optional extras. Blanks are dropped rather than rejected — an empty row is
     an unused slot, not an error. */
  const otherLinks = (Array.isArray(body?.otherLinks) ? body.otherLinks : [])
    .map((link: unknown) => String(link ?? "").trim())
    .filter(Boolean);

  if (!teamName || teamName.length > 80) {
    return NextResponse.json({ error: "Enter your team name." }, { status: 400 });
  }
  if (!gameTitle || gameTitle.length > 100) {
    return NextResponse.json({ error: "Name your game." }, { status: 400 });
  }
  if (notes.length > 800) {
    return NextResponse.json({ error: "That note is too long." }, { status: 400 });
  }
  if (invalidAttachment("build", build)) {
    return NextResponse.json({ error: "That build file is not valid." }, { status: 400 });
  }
  if (invalidAttachment("cover", cover)) {
    return NextResponse.json({ error: "That cover image is not valid." }, { status: 400 });
  }
  if (otherLinks.length > MAX_OTHER_LINKS) {
    return NextResponse.json(
      { error: `Up to ${MAX_OTHER_LINKS} extra links.` },
      { status: 400 },
    );
  }
  if (otherLinks.some((link: string) => !isHttpUrl(link))) {
    return NextResponse.json(
      { error: "One of the extra links is not a valid URL." },
      { status: 400 },
    );
  }

  /* Report and presentation: exactly one of file / link, each. Rejecting both
     at once matters as much as rejecting neither — two sources for one
     document is how the wrong version ends up being the one that gets read. */
  for (const [label, file, url, kind] of [
    ["report", report, reportUrl, "report"],
    ["presentation", deck, deckUrl, "deck"],
  ] as const) {
    if (file && url) {
      return NextResponse.json(
        { error: `Send the ${label} as a file or a link, not both.` },
        { status: 400 },
      );
    }
    if (!file && !url) {
      return NextResponse.json(
        { error: `Attach the ${label}, or paste a link to it.` },
        { status: 400 },
      );
    }
    if (file && invalidAttachment(kind, file)) {
      return NextResponse.json(
        { error: `That ${label} file is not valid.` },
        { status: 400 },
      );
    }
    if (url && !isHttpUrl(url)) {
      return NextResponse.json(
        { error: `That ${label} link is not a valid URL.` },
        { status: 400 },
      );
    }
  }

  const db = supabaseAdmin();

  /* The signed upload URL is handed out before the transfer, so a row could
     otherwise point at a file that never finished arriving. */
  for (const file of [build, cover, report, deck]) {
    if (!file) continue;
    const slash = file.path.lastIndexOf("/");
    const { data: found } = await db.storage
      .from(SUBMISSIONS_BUCKET)
      .list(file.path.slice(0, slash), {
        search: file.path.slice(slash + 1),
        limit: 1,
      });
    if (!found?.length) {
      return NextResponse.json(
        { error: "One of the uploads did not finish. Please try again." },
        { status: 400 },
      );
    }
  }

  const { error } = await db.from("game_submissions").insert({
    team_name: teamName,
    game_title: gameTitle,
    build_path: build!.path,
    build_name: build!.name,
    build_size: build!.size,
    cover_path: cover!.path,
    cover_name: cover!.name,
    cover_size: cover!.size,
    report_path: report?.path ?? null,
    report_name: report?.name ?? null,
    report_size: report?.size ?? null,
    report_url: reportUrl || null,
    deck_path: deck?.path ?? null,
    deck_name: deck?.name ?? null,
    deck_size: deck?.size ?? null,
    deck_url: deckUrl || null,
    other_links: otherLinks,
    notes: notes || null,
  });

  if (error) {
    console.error("saving game submission failed", error);
    return NextResponse.json({ error: "Could not save the submission." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
