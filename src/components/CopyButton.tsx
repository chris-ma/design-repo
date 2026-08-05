"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy prompt" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(event: React.MouseEvent<HTMLButtonElement>) {
    // Safe to nest inside a Link (e.g. a dashboard row) without triggering navigation.
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing useful to do beyond ignoring.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        copied
          ? "border-accent text-accent"
          : "border-line-strong text-ink-faint hover:border-ink hover:text-ink"
      }`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
