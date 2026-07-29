"use server";

import { supabaseAdmin } from "@/lib/supabase";
import type { RegistrationValues } from "@/components/registration/RegistrationForm";

export async function submitRegistration(values: RegistrationValues) {
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