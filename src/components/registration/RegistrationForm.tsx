"use client";

import { useState } from "react";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./registration-form.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-pixel",
});

const bodyFont = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-body",
});

export type RegistrationValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  discord: string;
  university: string;
  studentId: string;
  level: string;
  skills: string;
  expectations: string;
  attendance: "" | "both" | "13" | "14";
  staying: "no" | "yes";
  /** Honeypot: hidden from people, catnip for bots. Must arrive empty. */
  website: string;
  hasTeam: "no" | "yes";
  /* only filled in when hasTeam is "yes" */
  teamSize: "" | "2" | "3" | "4";
  teamName: string;
  teammate1: string;
  teammate2: string;
  teammate3: string;
};

type FieldName = keyof RegistrationValues;

type Props = {
  /** Fired by the top-right X and the CLOSE button — this opens over the site. */
  onClose?: () => void;
  /** Receives the values once validation passes. */
  onSubmit?: (values: RegistrationValues) => void | Promise<void>;
};

const EMPTY: RegistrationValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  discord: "",
  university: "",
  studentId: "",
  level: "",
  skills: "",
  expectations: "",
  attendance: "",
  staying: "no",
  website: "",
  hasTeam: "no",
  teamSize: "",
  teamName: "",
  teammate1: "",
  teammate2: "",
  teammate3: "",
};

/** The registrant counts as one, so a team of N needs N-1 names. */
const TEAM_SIZES = [
  { value: "2", label: "A team of 2 — me + 1 member" },
  { value: "3", label: "A team of 3 — me + 2 members" },
  { value: "4", label: "A team of 4 — me + 3 members" },
] as const;

const TEAMMATE_FIELDS: {
  name: Extract<FieldName, "teammate1" | "teammate2" | "teammate3">;
  label: string;
}[] = [
  { name: "teammate1", label: "Member 1" },
  { name: "teammate2", label: "Member 2" },
  { name: "teammate3", label: "Member 3" },
];

/** How many name fields a chosen size asks for. */
function memberCount(teamSize: RegistrationValues["teamSize"]) {
  return teamSize ? Number(teamSize) - 1 : 0;
}

function clearSquadErrors(current: Partial<Record<FieldName, string>>) {
  const next = { ...current };
  delete next.teamSize;
  delete next.teamName;
  delete next.teammate1;
  delete next.teammate2;
  delete next.teammate3;
  return next;
}

const LEVELS = ["High School", "L1", "L2", "L3", "M1", "M2"] as const;

const ATTENDANCE = [
  { value: "both", label: "Yes — both days" },
  { value: "13", label: "Only 13 August" },
  { value: "14", label: "Only 14 August" },
] as const;

/** Single-column text inputs, in the order they appear on the board. */
const TEXT_FIELDS: {
  name: Extract<
    FieldName,
    "email" | "phone" | "discord" | "university" | "studentId" | "skills"
  >;
  label: string;
  placeholder: string;
  type: "text" | "email" | "tel";
  autoComplete?: string;
  required?: boolean;
}[] = [
  {
    name: "email",
    label: "Email",
    placeholder: "Enter your email address",
    type: "email",
    autoComplete: "email",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    placeholder: "Enter your phone number",
    type: "tel",
    autoComplete: "tel",
    required: true,
  },
  {
    name: "discord",
    label: "Discord Tag",
    placeholder: "Enter your Discord username",
    type: "text",
  },
  {
    name: "university",
    label: "University",
    placeholder: "Enter your university name",
    type: "text",
    autoComplete: "organization",
    required: true,
  },
  {
    name: "studentId",
    label: "Student ID",
    placeholder: "Enter your student ID number",
    type: "text",
    required: true,
  },
];

/* Rendered after the study level so the academic fields stay together. */
const SKILLS_FIELD = {
  name: "skills",
  label: "Skills",
  placeholder: "E.g. Web dev, pixel art, sound design...",
} as const;

function validate(values: RegistrationValues) {
  const errors: Partial<Record<FieldName, string>> = {};

  if (!values.firstName.trim()) errors.firstName = "Enter your first name";
  if (!values.lastName.trim()) errors.lastName = "Enter your last name";
  if (!values.email.trim()) errors.email = "Enter your email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "That email looks broken";
  if (!values.phone.trim()) errors.phone = "Enter your phone number";
  if (!values.university.trim()) errors.university = "Enter your university";
  if (!values.studentId.trim()) errors.studentId = "Enter your student ID";
  if (!values.level) errors.level = "Pick your study level";
  if (!values.attendance) errors.attendance = "Tell us which days you can come";

  if (values.hasTeam === "yes") {
    if (!values.teamSize) errors.teamSize = "Pick your team size";
    if (!values.teamName.trim()) errors.teamName = "Name your squad";

    /* every slot the chosen size asks for has to be filled */
    const roster = [values.teammate1, values.teammate2, values.teammate3];
    TEAMMATE_FIELDS.slice(0, memberCount(values.teamSize)).forEach(
      (field, index) => {
        if (!roster[index].trim()) errors[field.name] = "Enter this member";
      },
    );
  }

  return errors;
}

export default function RegistrationForm({ onClose, onSubmit }: Props) {
  const [values, setValues] = useState<RegistrationValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const update =
    (name: FieldName) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [name]: value }));
      setErrors((current) => {
        if (!current[name]) return current;
        const next = { ...current };
        delete next[name];
        return next;
      });
    };

  /* switching back to "no" wipes the roster so stale names never get submitted */
  function handleTeamChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const hasTeam = event.target.value === "yes" ? "yes" : "no";
    setValues((current) => ({
      ...current,
      hasTeam,
      ...(hasTeam === "no"
        ? {
            teamSize: "" as const,
            teamName: "",
            teammate1: "",
            teammate2: "",
            teammate3: "",
          }
        : null),
    }));
    setErrors(clearSquadErrors);
  }

  /* shrinking the team drops the names it no longer asks for */
  function handleSizeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const teamSize = event.target.value as RegistrationValues["teamSize"];
    const slots = memberCount(teamSize);
    setValues((current) => ({
      ...current,
      teamSize,
      teammate2: slots >= 2 ? current.teammate2 : "",
      teammate3: slots >= 3 ? current.teammate3 : "",
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.teamSize;
      if (slots < 2) delete next.teammate2;
      if (slots < 3) delete next.teammate3;
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`jj-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      await onSubmit?.(values);
      setStatus("done");
    } catch (error) {
      setStatus("idle");
      setErrors({
        email:
          error instanceof Error ? error.message : "Sending failed, try again",
      });
    }
  }

  return (
    <div
      className={`jj-form ${pixelFont.variable} ${bodyFont.variable} w-full max-w-2xl`}
    >
      <div className="jj-frame jj-cut p-1">
        <div className="jj-frame__bevel jj-cut p-1">
          <div className="jj-frame__body jj-cut">
            {/* deep bottom padding keeps Sonic's head clear of the title —
                he stands 41px above the checker strip */}
            <header className="jj-header px-6 pt-7 pb-16 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <h2 className="jj-title text-base sm:text-xl">
                  Jammy Jam
                  <br />
                  <em>Registration</em>
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="jj-close jj-cut jj-cut--sm shrink-0"
                  aria-label="Close registration form"
                >
                  X
                </button>
              </div>
            </header>

            <div className="jj-track" aria-hidden="true">
              <div className="jj-checker" />
              <div className="jj-runner">
                <span className="jj-runner__bubble">Hey!</span>
                <span className="jj-runner__sprite" />
              </div>
            </div>

            {status === "done" ? (
              <div className="px-6 py-14 text-center sm:px-8">
                <div className="flex flex-col items-center gap-5">
                  <span className="jj-done__coin" aria-hidden="true" />
                  <p className="jj-done text-sm sm:text-base">
                    Player registered!
                  </p>
                  <p className="jj-hint max-w-sm">
                    Check your inbox — we&apos;ll send the Discord invite and
                    the jam briefing before day one.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="jj-btn jj-cut jj-cut--sm mt-2"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="px-6 py-7 sm:px-8"
              >
                {/* honeypot — off-screen rather than display:none, which some
                    bots know to skip. Never shown to a real user. */}
                <div aria-hidden="true" className="jj-trap">
                  <label htmlFor="jj-website">Website</label>
                  <input
                    id="jj-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={update("website")}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    name="firstName"
                    label="First Name"
                    required
                    error={errors.firstName}
                  >
                    <input
                      id="jj-firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Enter your first name"
                      value={values.firstName}
                      onChange={update("firstName")}
                      aria-invalid={Boolean(errors.firstName)}
                      aria-describedby={
                        errors.firstName ? "jj-firstName-error" : undefined
                      }
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field
                    name="lastName"
                    label="Last Name"
                    required
                    error={errors.lastName}
                  >
                    <input
                      id="jj-lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Enter your last name"
                      value={values.lastName}
                      onChange={update("lastName")}
                      aria-invalid={Boolean(errors.lastName)}
                      aria-describedby={
                        errors.lastName ? "jj-lastName-error" : undefined
                      }
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>
                </div>

                <div className="mt-5 grid gap-5">
                  {TEXT_FIELDS.map((field) => (
                    <Field
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      required={field.required}
                      error={errors[field.name]}
                    >
                      <input
                        id={`jj-${field.name}`}
                        name={field.name}
                        type={field.type}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        value={values[field.name]}
                        onChange={update(field.name)}
                        aria-invalid={Boolean(errors[field.name])}
                        aria-describedby={
                          errors[field.name]
                            ? `jj-${field.name}-error`
                            : undefined
                        }
                        className="jj-input jj-cut jj-cut--sm"
                      />
                    </Field>
                  ))}

                  <Field
                    name="level"
                    label="Study Level"
                    required
                    error={errors.level}
                  >
                    <div className="jj-select">
                      <select
                        id="jj-level"
                        name="level"
                        value={values.level}
                        onChange={update("level")}
                        aria-invalid={Boolean(errors.level)}
                        aria-describedby={
                          errors.level ? "jj-level-error" : undefined
                        }
                        className="jj-input jj-cut jj-cut--sm"
                      >
                        <option value="">Pick your level</option>
                        {LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <Field name="skills" label={SKILLS_FIELD.label}>
                    <input
                      id="jj-skills"
                      name="skills"
                      type="text"
                      placeholder={SKILLS_FIELD.placeholder}
                      value={values.skills}
                      onChange={update("skills")}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field
                    name="expectations"
                    label="What are you expecting from this event?"
                  >
                    <textarea
                      id="jj-expectations"
                      name="expectations"
                      rows={4}
                      placeholder="Share what you hope to gain from this jam..."
                      value={values.expectations}
                      onChange={update("expectations")}
                      className="jj-input jj-cut jj-cut--sm"
                    />
                  </Field>

                  <Field
                    name="attendance"
                    label="Can you attend both days (13 & 14 August)?"
                    required
                    error={errors.attendance}
                  >
                    <div className="jj-select">
                      <select
                        id="jj-attendance"
                        name="attendance"
                        value={values.attendance}
                        onChange={update("attendance")}
                        aria-invalid={Boolean(errors.attendance)}
                        aria-describedby={
                          errors.attendance ? "jj-attendance-error" : undefined
                        }
                        className="jj-input jj-cut jj-cut--sm"
                      >
                        <option value="">Pick your availability</option>
                        {ATTENDANCE.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <Field
                    name="staying"
                    label="Staying the night of 13 August?"
                  >
                    <div className="jj-select">
                      <select
                        id="jj-staying"
                        name="staying"
                        value={values.staying}
                        onChange={update("staying")}
                        className="jj-input jj-cut jj-cut--sm"
                      >
                        <option value="no">No — going home that night</option>
                        <option value="yes">Yes — sleeping at the venue</option>
                      </select>
                    </div>
                  </Field>

                  <Field name="hasTeam" label="Do you have a team?">
                    <div className="jj-select">
                      <select
                        id="jj-hasTeam"
                        name="hasTeam"
                        value={values.hasTeam}
                        onChange={handleTeamChange}
                        className="jj-input jj-cut jj-cut--sm"
                      >
                        <option value="no">No — find me one</option>
                        <option value="yes">Yes — squad ready</option>
                      </select>
                    </div>
                  </Field>

                  {values.hasTeam === "yes" ? (
                    <div className="jj-squad jj-cut jj-cut--sm p-5">
                      <p className="jj-squad__title">Squad roster</p>
                      <p className="jj-squad__note">
                        Pick the total size of your team, yourself included.
                        You are already registered, so only name the other
                        members below.
                      </p>
                      <div className="mt-5 grid gap-5">
                        <Field
                          name="teamSize"
                          label="Team Size"
                          required
                          error={errors.teamSize}
                        >
                          <div className="jj-select">
                            <select
                              id="jj-teamSize"
                              name="teamSize"
                              value={values.teamSize}
                              onChange={handleSizeChange}
                              aria-invalid={Boolean(errors.teamSize)}
                              aria-describedby={
                                errors.teamSize ? "jj-teamSize-error" : undefined
                              }
                              className="jj-input jj-cut jj-cut--sm"
                            >
                              <option value="">Pick your team size</option>
                              {TEAM_SIZES.map((size) => (
                                <option key={size.value} value={size.value}>
                                  {size.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </Field>

                        <Field
                          name="teamName"
                          label="Team Name"
                          required
                          error={errors.teamName}
                        >
                          <input
                            id="jj-teamName"
                            name="teamName"
                            type="text"
                            placeholder="Enter your team name"
                            value={values.teamName}
                            onChange={update("teamName")}
                            aria-invalid={Boolean(errors.teamName)}
                            aria-describedby={
                              errors.teamName ? "jj-teamName-error" : undefined
                            }
                            className="jj-input jj-cut jj-cut--sm"
                          />
                        </Field>

                        <div className="grid gap-5">
                          {TEAMMATE_FIELDS.slice(
                            0,
                            memberCount(values.teamSize),
                          ).map((field) => (
                            <Field
                              key={field.name}
                              name={field.name}
                              label={field.label}
                              required
                              error={errors[field.name]}
                            >
                              <input
                                id={`jj-${field.name}`}
                                name={field.name}
                                type="text"
                                placeholder="Full name"
                                value={values[field.name]}
                                onChange={update(field.name)}
                                aria-invalid={Boolean(errors[field.name])}
                                aria-describedby={
                                  errors[field.name]
                                    ? `jj-${field.name}-error`
                                    : undefined
                                }
                                className="jj-input jj-cut jj-cut--sm"
                              />
                            </Field>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="jj-checker mt-8 -mx-6 sm:-mx-8" aria-hidden="true" />

                <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={onClose}
                    className="jj-btn jj-btn--ghost jj-cut jj-cut--sm"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="jj-btn jj-cut jj-cut--sm"
                  >
                    {status === "sending" ? "Loading..." : "Register"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  required,
  error,
  children,
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="jj-field flex flex-col gap-2">
      <label className="jj-label" htmlFor={`jj-${name}`}>
        {label}
        {required ? (
          <span className="jj-req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="jj-error" id={`jj-${name}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
