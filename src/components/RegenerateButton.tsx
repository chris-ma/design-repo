"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DesignItem } from "@/types/item";

/**
 * Re-runs the AI breakdown for an item. Pass `onUpdated` where the item lives
 * in client state (the dashboard); without it the button refreshes the current
 * server-rendered route instead (the item page).
 */
export function RegenerateButton({
  id,
  label = "Regenerate",
  onUpdated,
}: {
  id: string;
  label?: string;
  onUpdated?: (item: DesignItem) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Safe to nest inside a Link (e.g. a dashboard row) without navigating.
    event.preventDefault();
    event.stopPropagation();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${id}/reanalyze`, { method: "POST" });
      const data = (await res.json()) as { item?: DesignItem; error?: string };
      if (!res.ok || !data.item) {
        setError(data.error || "Could not regenerate.");
        return;
      }
      if (onUpdated) {
        onUpdated(data.item);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex min-w-0 items-center gap-3">
      {error && <span className="truncate text-xs text-accent">{error}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="shrink-0 whitespace-nowrap rounded-full border border-line-strong px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Analysing…" : label}
      </button>
    </span>
  );
}
