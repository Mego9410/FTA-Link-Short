"use client";

import { useActionState } from "react";
import { login, type ActionState } from "@/app/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    login,
    null
  );

  return (
    <form action={formAction}>
      {state?.error ? <div className="alert alert-error">{state.error}</div> : null}
      <div className="form-row">
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          placeholder="Enter the team password"
          autoFocus
          required
        />
      </div>
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
        {pending ? "Checking..." : "Sign in"}
      </button>
    </form>
  );
}
