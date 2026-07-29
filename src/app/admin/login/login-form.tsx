"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="login-form">
      <label htmlFor="password">Admin password</label>
      <div className="password-field">
        <span aria-hidden="true">◆</span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          required
          autoFocus
        />
      </div>
      {state.error && <p className="login-error" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Enter dashboard"}
      </button>
    </form>
  );
}
