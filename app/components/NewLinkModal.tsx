"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import CreateLinkForm from "@/app/components/CreateLinkForm";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function NewLinkModal({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary new-link-btn"
        onClick={() => setOpen(true)}
      >
        <PlusIcon />
        New short link
      </button>

      {open ? (
        <Modal title="Create a short link" onClose={() => setOpen(false)}>
          <CreateLinkForm slug={slug} onSuccess={() => setOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}
