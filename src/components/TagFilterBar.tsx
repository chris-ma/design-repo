"use client";

import { useMemo, useState } from "react";

const MAX_SUGGESTIONS = 5;

export function TagFilterBar({
  tags,
  selectedTags,
  onToggleTag,
  query,
  onQueryChange,
}: {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return tags
      .filter((tag) => tag.toLowerCase().includes(normalized) && !selectedTags.includes(tag))
      .slice(0, MAX_SUGGESTIONS);
  }, [tags, query, selectedTags]);

  function selectSuggestion(tag: string) {
    onToggleTag(tag);
    onQueryChange("");
    setSuggestionsOpen(false);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative w-full">
        <div className="flex items-center gap-3 border-b border-line-strong pb-3 transition-colors focus-within:border-ink">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-4 w-4 shrink-0 text-ink-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="M13.5 13.5 17.5 17.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search by title or design language…"
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => setSuggestionsOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSuggestionsOpen(false);
            }}
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        {suggestionsOpen && suggestions.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-sm border border-line bg-surface py-1 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.18)]">
            {suggestions.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(tag)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
                >
                  {tag}
                  <span className="label">Filter</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className="group flex items-center gap-2 rounded-full border border-ink bg-ink px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-paper transition-opacity hover:opacity-70"
            >
              {tag}
              <span aria-hidden className="text-[0.8125rem] leading-none">
                ×
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
