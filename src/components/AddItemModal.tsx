"use client";

import { useState } from "react";
import type { CreateItemResponse, DesignItem } from "@/types/item";

type Mode = "url" | "upload";

export function AddItemModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (item: DesignItem) => void;
}) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadSourceUrl, setUploadSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function resetForm() {
    setUrl("");
    setFiles([]);
    setUploadSourceUrl("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "url") {
      setLoading(true);
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
        resetForm();
        onClose();
      } catch {
        setError("Network error — please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (files.length === 0) {
      setError("Choose one or more images to upload.");
      return;
    }

    setLoading(true);
    const failures: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      const formData = new FormData();
      formData.append("file", files[i]);
      if (uploadSourceUrl.trim()) formData.append("sourceUrl", uploadSourceUrl.trim());
      try {
        const res = await fetch("/api/items", { method: "POST", body: formData });
        const data = (await res.json()) as CreateItemResponse & { error?: string };
        if (!res.ok) {
          failures.push(`${files[i].name}: ${data.error || "failed"}`);
          continue;
        }
        onCreated(data.item);
      } catch {
        failures.push(`${files[i].name}: network error`);
      }
    }
    setProgress(null);
    setLoading(false);

    if (failures.length === 0) {
      resetForm();
      onClose();
    } else {
      setFiles([]);
      setError(`${failures.length} of ${files.length} upload(s) failed:\n${failures.join("\n")}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add inspiration</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Paste a URL, or upload one or more screenshots/images directly.
        </p>

        <div className="mb-4 flex gap-1 rounded-md bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "url"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Paste URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "upload"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Upload image
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "url" ? (
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
          ) : (
            <>
              <input
                type="file"
                required
                multiple
                accept="image/png,image/jpeg"
                onChange={(event) => setFiles(event.target.files ? Array.from(event.target.files) : [])}
                disabled={loading}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-sm file:font-medium disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:file:bg-zinc-700"
              />
              {files.length > 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {files.length} image{files.length > 1 ? "s" : ""} selected
                </p>
              )}
              <input
                type="url"
                placeholder="Source link (optional)"
                value={uploadSourceUrl}
                onChange={(event) => setUploadSourceUrl(event.target.value)}
                disabled={loading}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </>
          )}
          {error && <p className="whitespace-pre-line text-sm text-red-600 dark:text-red-400">{error}</p>}
          {loading && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {mode === "url"
                  ? "Rendering page and analyzing with Claude — this can take up to a minute…"
                  : progress
                    ? `Analyzing ${progress.current} of ${progress.total} with Claude…`
                    : "Analyzing with Claude…"}
              </p>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                {progress && progress.total > 1 ? (
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-[width] duration-300 dark:bg-zinc-100"
                    style={{ width: `${((progress.current - 1) / progress.total) * 100}%` }}
                  />
                ) : (
                  <div
                    className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-zinc-900 dark:bg-zinc-100"
                    style={{ animation: "progress-indeterminate 1.2s ease-in-out infinite" }}
                  />
                )}
              </div>
            </div>
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
              {loading ? (progress ? `Adding ${progress.current}/${progress.total}…` : "Adding…") : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
