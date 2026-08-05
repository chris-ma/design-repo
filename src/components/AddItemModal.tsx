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

  const tabClass = (active: boolean) =>
    `-mb-px border-b-2 pb-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors ${
      active ? "border-ink text-ink" : "border-transparent text-ink-faint hover:text-ink-soft"
    }`;

  const fieldClass =
    "w-full border-b border-line-strong bg-transparent pb-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-lg border border-line bg-surface p-7 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.28)] sm:rounded-sm sm:p-9">
        <h2 className="font-display text-3xl leading-tight text-ink">Add a reference</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Paste a link, or upload screenshots you&rsquo;ve already collected.
        </p>

        <div className="mt-7 flex gap-7 border-b border-line">
          <button type="button" onClick={() => setMode("url")} className={tabClass(mode === "url")}>
            Paste URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={tabClass(mode === "upload")}
          >
            Upload images
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-6">
          {mode === "url" ? (
            <input
              type="url"
              required
              autoFocus
              placeholder="https://dribbble.com/shots/…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={loading}
              className={fieldClass}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  required
                  multiple
                  accept="image/png,image/jpeg"
                  onChange={(event) => setFiles(event.target.files ? Array.from(event.target.files) : [])}
                  disabled={loading}
                  className="w-full text-sm text-ink-soft file:mr-4 file:rounded-full file:border file:border-line-strong file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[0.6875rem] file:uppercase file:tracking-[0.1em] file:text-ink file:transition-colors hover:file:border-ink disabled:opacity-50"
                />
                {files.length > 0 && (
                  <span className="label">
                    {files.length} image{files.length > 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
              <input
                type="url"
                placeholder="Source link (optional)"
                value={uploadSourceUrl}
                onChange={(event) => setUploadSourceUrl(event.target.value)}
                disabled={loading}
                className={fieldClass}
              />
            </>
          )}

          {error && (
            <p className="whitespace-pre-line border-l-2 border-accent pl-3 text-sm leading-relaxed text-ink-soft">
              {error}
            </p>
          )}

          {loading && (
            <div className="flex flex-col gap-2">
              <span className="label">
                {mode === "url"
                  ? "Rendering page and analysing — up to a minute"
                  : progress
                    ? `Analysing ${progress.current} of ${progress.total}`
                    : "Analysing"}
              </span>
              <div className="relative h-px w-full overflow-hidden bg-line">
                {progress && progress.total > 1 ? (
                  <div
                    className="h-full bg-accent transition-[width] duration-300"
                    style={{ width: `${((progress.current - 1) / progress.total) * 100}%` }}
                  />
                ) : (
                  <div
                    className="absolute inset-y-0 left-0 w-1/3 bg-accent"
                    style={{ animation: "progress-indeterminate 1.2s ease-in-out infinite" }}
                  />
                )}
              </div>
            </div>
          )}

          <div className="mt-1 flex items-center justify-end gap-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="label transition-colors hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (progress ? `Adding ${progress.current}/${progress.total}` : "Adding…") : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
