"use client";

import type { SourcePlatform } from "@/types/item";

const PLATFORMS: Array<{ value: SourcePlatform | "all"; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "dribbble", label: "Dribbble" },
  { value: "pinterest", label: "Pinterest" },
  { value: "awwwards", label: "Awwwards" },
  { value: "other", label: "Other" },
];

export function TagFilterBar({
  tags,
  selectedTags,
  onToggleTag,
  platform,
  onPlatformChange,
  query,
  onQueryChange,
}: {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  platform: SourcePlatform | "all";
  onPlatformChange: (platform: SourcePlatform | "all") => void;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <input
          type="search"
          placeholder="Search title or tags…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full max-w-lg rounded-full border border-zinc-300 bg-white px-5 py-3 text-base shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <select
          value={platform}
          onChange={(event) => onPlatformChange(event.target.value as SourcePlatform | "all")}
          className="rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
