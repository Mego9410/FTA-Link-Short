"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLink, type ActionState } from "@/app/actions";

export default function CreateLinkForm({
  slug,
  onSuccess,
}: {
  slug: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createLink,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  // Detect a completed submission: pending goes true -> false. If there's no
  // error in the returned state, treat it as a success (reset + notify caller).
  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error) {
        formRef.current?.reset();
        onSuccess?.();
      }
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  return (
    <form action={formAction} ref={formRef}>
      {state?.error ? <div className="alert alert-error">{state.error}</div> : null}
      <input type="hidden" name="slug" value={slug} />

      <div className="form-row">
        <label className="field-label" htmlFor="original_url">
          Destination (long URL)
        </label>
        <input
          id="original_url"
          name="original_url"
          className="field"
          placeholder="https://example.com/a/very/long/path"
          required
        />
        <p className="field-hint">https:// is added automatically if you omit it.</p>
      </div>

      <div className="form-row">
        <label className="field-label" htmlFor="title">
          Label <span style={{ color: "var(--fg-3)", fontWeight: 500 }}>(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          className="field"
          placeholder="e.g. Spring campaign"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creating..." : "Create short link"}
        </button>
      </div>
    </form>
  );
}
