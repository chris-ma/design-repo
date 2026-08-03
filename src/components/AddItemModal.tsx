"use client";

import { useState } from "react";
import type { CreateItemResponse, DesignItem } from "@/types/item";

export function AddItemModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (item: DesignItem) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as CreateItemResponse & { error?: string };

      if (!res.ok) {
        setError(data.error || "Something went wrong adding that item.");
        return;
      }

      onCreated(data.item);
      setUrl("");
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add inspiration</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Paste a Dribbble, Pinterest, Awwwards, or any design URL.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="url"
            required
            autoFocus
            placeholder="https://dribbble.com/shots/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={loading}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {loading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Rendering page and analyzing with Claude — this can take up to a minute…
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {loading ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
