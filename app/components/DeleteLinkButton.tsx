"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import { deleteLink } from "@/app/actions";

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export default function DeleteLinkButton({
  slug,
  code,
  label,
  variant = "icon",
}: {
  slug: string;
  code: string;
  label: string;
  /** "icon" for the compact table button, "button" for a full labelled button. */
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          className="icon-action danger"
          onClick={() => setOpen(true)}
          aria-label="Delete link"
          title="Delete link"
        >
          <TrashIcon />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-danger-ghost btn-sm icon-btn"
          onClick={() => setOpen(true)}
        >
          <TrashIcon />
          Delete link
        </button>
      )}

      {open ? (
        <Modal title="Delete short link" onClose={() => setOpen(false)}>
          <p style={{ marginTop: 0, color: "var(--fg-2)" }}>
            This permanently deletes <strong>{label}</strong> and its click
            history. The short link will stop working. This can&apos;t be undone.
          </p>
          <form action={deleteLink}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="code" value={code} />
            <div className="form-actions">
              <button type="submit" className="btn btn-danger">
                Delete link
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
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
