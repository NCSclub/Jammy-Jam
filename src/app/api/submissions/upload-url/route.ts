import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  buildExtension,
  MAX_BUILD_SIZE,
  safeBuildName,
  SUBMISSIONS_BUCKET,
} from "@/lib/submissions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fileName = String(body?.fileName ?? "");
  const fileSize = Number(body?.fileSize ?? 0);
  const extension = buildExtension(fileName);

  if (!extension) {
    return NextResponse.json(
      { error: "Upload a .zip, .rar, .7z or .exe build." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_BUILD_SIZE) {
    return NextResponse.json(
      { error: "The build must be smaller than 500 MB." },
      { status: 400 },
    );
  }

  const path = `${new Date().getUTCFullYear()}/${randomUUID()}-${safeBuildName(fileName)}`;
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
  return NextResponse.json({
    path,
    uploadUrl,
  });
}
