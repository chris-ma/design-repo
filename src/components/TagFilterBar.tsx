"use client";

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
