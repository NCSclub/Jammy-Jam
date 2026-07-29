"use server";

import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { isRegistrationOpen } from "@/lib/registration-window";
import type { RegistrationValues } from "@/components/registration/RegistrationForm";

/* Best-effort throttle. It lives in memory, so on serverless it is per
   instance rather than global — enough to stop a naive script hammering one
   endpoint, not a distributed flood. The unique email constraint and the
   honeypot do the rest. */
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const hits = new Map<string, number[]>();

function rateLimit(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (at) => now - at < RATE_LIMIT.windowMs,
  );

  if (recent.length >= RATE_LIMIT.max) return false;

  recent.push(now);
  hits.set(ip, recent);

  /* keep the map from growing forever on a long-lived instance */
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((at) => now - at < RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }
  return true;
}

export async function submitRegistration(values: RegistrationValues) {
  if (!isRegistrationOpen()) {
    throw new Error("Registrations are closed");
  }

  /* a filled honeypot means a bot: accept silently so it does not retry */
  if (values.website?.trim()) return;

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip)) {
    throw new Error("Too many attempts, wait a few minutes and try again");
  }

  const required = [
    values.firstName,
    values.lastName,
    values.email,
    values.phone,
    values.university,
    values.studentId,
    values.level,
    values.attendance,
  ];
  if (required.some((value) => !value?.trim())) {
    throw new Error("Some required fields are missing");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    throw new Error("That email looks broken");
  }

  const hasTeam = values.hasTeam === "yes";

  const { error } = await supabaseAdmin().from("registrations").insert({
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    discord: values.discord.trim() || null,
    university: values.university.trim(),
    student_id: values.studentId.trim(),
    level: values.level,
    skills: values.skills.trim() || null,
    expectations: values.expectations.trim() || null,
    attendance: values.attendance,
    staying: values.staying === "yes",
    has_team: hasTeam,
    team_size: hasTeam && values.teamSize ? Number(values.teamSize) : null,
    team_name: hasTeam ? values.teamName.trim() : null,
    team_members: hasTeam
      ? [values.teammate1, values.teammate2, values.teammate3]
          .map((name) => name.trim())
          .filter(Boolean)
      : [],
  });

  if (error) {
    // 23505 = unique violation, i.e. this email already registered
    if (error.code === "23505") {
      throw new Error("This email is already registered");
    }
    console.error("registration insert failed", error);
    throw new Error("Could not save your registration, try again");
  }
}