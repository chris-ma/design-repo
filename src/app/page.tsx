"use client";

import { useEffect, useMemo, useState } from "react";
import { AddItemModal } from "@/components/AddItemModal";
import { ItemList } from "@/components/ItemList";
import { TagFilterBar } from "@/components/TagFilterBar";
import type { DesignItem } from "@/types/item";

export default function Home() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadItems() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

      try {
        const res = await fetch(`/api/items?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load items.");
        const data = (await res.json()) as { items: DesignItem[] };
        setItems(data.items);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Could not load your dashboard. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    loadItems();
    return () => controller.abort();
  }, [selectedTags]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => item.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
    );
  }, [items, query]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function replaceItem(updated: DesignItem) {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  const countLabel = loading
    ? "Loading"
    : `${visibleItems.length} ${visibleItems.length === 1 ? "reference" : "references"}`;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl leading-none text-ink">Archive</span>
            <span className="label hidden sm:inline">Design reference</span>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-80"
          >
            Add reference
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="border-b border-line pb-10 pt-14 sm:pb-12 sm:pt-20">
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-7xl">
            A library of
            <br />
            <span className="italic text-accent">borrowed</span> good taste.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
            Screenshots, design language, and ready-to-paste prompts — captured so the next project
            starts from something considered.
          </p>

          <div className="mt-10 max-w-xl">
            <TagFilterBar
              tags={availableTags}
              selectedTags={selectedTags}
              onToggleTag={toggleTag}
              query={query}
              onQueryChange={setQuery}
            />
          </div>
        </section>

        <div className="flex items-center justify-between py-5">
          <span className="label">{countLabel}</span>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="label transition-colors hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <p className="mb-6 border-l-2 border-accent pl-4 text-sm text-ink-soft">{error}</p>
        )}

        <div className="pb-24">
          {loading ? (
            <ul className="divide-y divide-line border-y border-line">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex animate-pulse gap-6 py-7">
                  <div className="h-32 w-full shrink-0 rounded-sm bg-sunken sm:h-[168px] sm:w-[268px]" />
                  <div className="hidden flex-1 flex-col gap-3 pt-1 sm:flex">
                    <div className="h-5 w-2/5 rounded-sm bg-sunken" />
                    <div className="h-3 w-full rounded-sm bg-sunken" />
                    <div className="h-3 w-4/5 rounded-sm bg-sunken" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ItemList items={visibleItems} onItemUpdated={replaceItem} />
          )}
        </div>
      </main>

      <AddItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(item) => setItems((prev) => [item, ...prev])}
      />
    </>
  );
}
