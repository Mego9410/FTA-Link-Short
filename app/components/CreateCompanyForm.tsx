"use client";

import { useActionState } from "react";
import { createCompany, type ActionState } from "@/app/actions";
import { slugify } from "@/lib/slug";
import { displayHost } from "@/lib/url";
import { useState } from "react";

export default function CreateCompanyForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createCompany,
    null
  );
  const [name, setName] = useState("");
  const host = displayHost();
  const preview = name ? slugify(name) : "";

  return (
    <form action={formAction} className="panel">
      <h3 className="h3" style={{ marginBottom: 16 }}>
        Add a company
      </h3>
      {state?.error ? <div className="alert alert-error">{state.error}</div> : null}
      <div className="form-row">
        <label className="field-label" htmlFor="name">
          Business name
        </label>
        <input
          id="name"
          name="name"
          className="field"
          placeholder="e.g. Acme Dental"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <p className="field-hint">
          {preview ? (
            <>
              Links will look like{" "}
              <span className="url-pretty">
                {host}/<span className="host">{preview}</span>/abc123
              </span>
            </>
          ) : (
            "A URL-friendly handle is generated automatically from the name."
          )}
        </p>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creating..." : "Create company"}
        </button>
      </div>
    </form>
  );
}
