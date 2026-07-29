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
  skills: string;
  expectations: string;
  hasTeam: "no" | "yes";
};

type FieldName = keyof RegistrationValues;

type Props = {
  /** Renders the X button and the CLOSE action when provided. */
  onClose?: () => void;
  /** Receives the values once validation passes. */
  onSubmit?: (values: RegistrationValues) => void | Promise<void>;
  eventDate?: string;
};

const EMPTY: RegistrationValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  discord: "",
  university: "",
  studentId: "",
  skills: "",
  expectations: "",
  hasTeam: "no",
};

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
  {
    name: "skills",
    label: "Skills",
    placeholder: "E.g. Web dev, pixel art, sound design...",
    type: "text",
  },
];

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

  return errors;
}

export default function RegistrationForm({
  onClose,
  onSubmit,
  eventDate = "17 / 18 April 2026",
}: Props) {
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
    } catch {
      setStatus("idle");
      setErrors({ email: "Sending failed, try again" });
    }
  }

  return (
    <div
      className={`jj-form ${pixelFont.variable} ${bodyFont.variable} w-full max-w-2xl`}
    >
      <div className="jj-frame jj-cut p-1">
        <div className="jj-frame__bevel jj-cut p-1">
          <div className="jj-frame__body jj-cut">
            <header className="jj-header px-6 pt-6 pb-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <h2 className="jj-title text-base sm:text-xl">
                  Jammy Jam
                  <br />
                  Registration
                </h2>
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="jj-close jj-cut jj-cut--sm shrink-0"
                    aria-label="Close registration form"
                  >
                    X
                  </button>
                ) : null}
              </div>
              <p className="jj-subtitle mt-4 flex items-center gap-3 text-[9px] sm:text-[10px]">
                <span className="jj-cal" aria-hidden="true" />
                {eventDate}
              </p>
            </header>

            <div className="jj-checker" aria-hidden="true" />

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
                  {onClose ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="jj-btn jj-cut jj-cut--sm mt-2"
                    >
                      Back
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <form
                noValidate
                onSubmit={handleSubmit}
                className="px-6 py-7 sm:px-8"
              >
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

                  <Field name="hasTeam" label="Do you have a team?">
                    <div className="jj-select">
                      <select
                        id="jj-hasTeam"
                        name="hasTeam"
                        value={values.hasTeam}
                        onChange={update("hasTeam")}
                        className="jj-input jj-cut jj-cut--sm"
                      >
                        <option value="no">No — find me one</option>
                        <option value="yes">Yes — squad ready</option>
                      </select>
                    </div>
                  </Field>
                </div>

                <div className="jj-checker mt-8 -mx-6 sm:-mx-8" aria-hidden="true" />

                <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
                  {onClose ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="jj-btn jj-btn--ghost jj-cut jj-cut--sm"
                    >
                      Close
                    </button>
                  ) : (
                    <span />
                  )}
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
