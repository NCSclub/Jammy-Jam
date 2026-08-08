import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildExtension, MAX_BUILD_SIZE, SUBMISSIONS_BUCKET } from "@/lib/submissions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const values = {
    team_name: String(body?.teamName ?? "").trim(),
    game_title: String(body?.gameTitle ?? "").trim(),
    contact_email: String(body?.contactEmail ?? "").trim().toLowerCase(),
    description: String(body?.description ?? "").trim(),
    controls: String(body?.controls ?? "").trim(),
    build_path: String(body?.buildPath ?? ""),
    build_name: String(body?.buildName ?? ""),
    build_size: Number(body?.buildSize ?? 0),
  };

  if (!values.team_name || !values.game_title || !values.contact_email || !values.description || !values.controls) {
    return NextResponse.json({ error: "Please complete every field." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(values.contact_email)) {
    return NextResponse.json({ error: "Enter a valid contact email." }, { status: 400 });
  }
  if (
    !values.build_path ||
    !buildExtension(values.build_name) ||
    values.build_size <= 0 ||
    values.build_size > MAX_BUILD_SIZE
  ) {
    return NextResponse.json({ error: "That build file is not valid." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: files } = await db.storage.from(SUBMISSIONS_BUCKET).list(
    values.build_path.slice(0, values.build_path.lastIndexOf("/")),
    { search: values.build_path.slice(values.build_path.lastIndexOf("/") + 1), limit: 1 },
  );
  if (!files?.length) {
    return NextResponse.json({ error: "The build upload did not finish." }, { status: 400 });
  }

  const { error } = await db.from("game_submissions").insert(values);
  if (error) {
    console.error("saving game submission failed", error);
    return NextResponse.json({ error: "Could not save the submission." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
