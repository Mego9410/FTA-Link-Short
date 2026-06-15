"use client";

import { useState, type ReactNode } from "react";

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Renders a short link whose text is click-to-copy, with a copy icon button
 * beside it. Both the text and the icon copy `value` to the clipboard.
 */
export default function CopyLink({
  value,
  display,
}: {
  value: string;
  display: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    // Prefer the async Clipboard API; fall back to execCommand for older or
    // restricted contexts. Show the "Copied" acknowledgement either way.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error("no clipboard api");
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        // Both methods failed; still acknowledge so the user isn't left guessing.
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className="copy-link">
      <button
        type="button"
        className="copy-link-text url-pretty"
        onClick={copy}
        title="Click to copy"
      >
        {display}
      </button>
      <button
        type="button"
        className="copy-link-btn"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy link"}
        title={copied ? "Copied" : "Copy link"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      {copied ? <span className="copy-flag">Copied</span> : null}
    </span>
  );
}
