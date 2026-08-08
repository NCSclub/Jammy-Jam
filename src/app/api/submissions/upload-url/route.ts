import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  ASSETS,
  assetExtension,
  isAssetKind,
  safeFileName,
  SUBMISSIONS_BUCKET,
} from "@/lib/submissions";

/**
 * Hands the browser a one-shot upload URL for one attachment.
 *
 * `kind` decides which rules apply — the four attachments have very different
 * ceilings, and a 500 MB cover screenshot is not a screenshot.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kind = body?.kind;
  const fileName = String(body?.fileName ?? "");
  const fileSize = Number(body?.fileSize ?? 0);

  if (!isAssetKind(kind)) {
    return NextResponse.json({ error: "Unknown attachment." }, { status: 400 });
  }

  const spec = ASSETS[kind];

  if (!assetExtension(kind, fileName)) {
    return NextResponse.json(
      { error: `Upload ${spec.extensions.join(", ")} for the ${spec.label}.` },
      { status: 400 },
    );
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > spec.maxSize) {
    return NextResponse.json(
      { error: `That ${spec.label} is over the size limit.` },
      { status: 400 },
    );
  }

  const path = `${spec.folder}/${new Date().getUTCFullYear()}/${randomUUID()}-${safeFileName(fileName)}`;
  const { data, error } = await supabaseAdmin()
    .storage
    .from(SUBMISSIONS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("creating submission upload URL failed", error);
    return NextResponse.json(
      { error: "Submission storage is not ready yet." },
      { status: 500 },
    );
  }

  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const uploadUrl = data.signedUrl.startsWith("http")
    ? data.signedUrl
    : `${baseUrl}${data.signedUrl}`;
  return NextResponse.json({ path, uploadUrl });
}
