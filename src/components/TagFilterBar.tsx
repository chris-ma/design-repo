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
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative w-full max-w-lg">
        <input
          type="search"
          placeholder="Search title or tags…"
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
          className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-base shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        {suggestionsOpen && suggestions.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {suggestions.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(tag)}
                  className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className="flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {tag}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
