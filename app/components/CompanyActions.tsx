"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Modal from "@/app/components/Modal";
import { renameCompany, deleteCompany, type ActionState } from "@/app/actions";

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export default function CompanyActions({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    renameCompany,
    null
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error) setRenameOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      <button
        type="button"
        className="btn btn-outline-ink btn-sm icon-btn"
        onClick={() => setRenameOpen(true)}
      >
        <PencilIcon />
        Rename
      </button>
      <button
        type="button"
        className="btn btn-danger-ghost btn-sm icon-btn"
        onClick={() => setDeleteOpen(true)}
      >
        <TrashIcon />
        Delete
      </button>

      {renameOpen ? (
        <Modal title="Rename company" onClose={() => setRenameOpen(false)}>
          <form action={formAction}>
            {state?.error ? (
              <div className="alert alert-error">{state.error}</div>
            ) : null}
            <input type="hidden" name="slug" value={slug} />
            <div className="form-row">
              <label className="field-label" htmlFor="rename-name">
                Business name
              </label>
              <input
                id="rename-name"
                name="name"
                className="field"
                defaultValue={name}
                required
                autoFocus
              />
              <p className="field-hint">
                The link prefix (<span className="url-pretty">/{slug}</span>) stays
                the same, so existing short links keep working.
              </p>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteOpen ? (
        <Modal title="Delete company" onClose={() => setDeleteOpen(false)}>
          <p style={{ marginTop: 0, color: "var(--fg-2)" }}>
            This permanently deletes <strong>{name}</strong>, all of its short
            links, and their click history. This can&apos;t be undone.
          </p>
          <form action={deleteCompany}>
            <input type="hidden" name="slug" value={slug} />
            <div className="form-actions">
              <button type="submit" className="btn btn-danger">
                Delete company
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
