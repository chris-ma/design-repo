"use client";

import { useEffect, useMemo, useState } from "react";
import { AddItemModal } from "@/components/AddItemModal";
import { ItemList } from "@/components/ItemList";
import { TagFilterBar } from "@/components/TagFilterBar";
import type { DesignItem, SourcePlatform } from "@/types/item";

export default function Home() {
  const [items, setItems] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [platform, setPlatform] = useState<SourcePlatform | "all">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadItems() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (platform !== "all") params.set("platform", platform);
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
  }, [platform, selectedTags]);

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-6 py-14 text-center dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 sm:px-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Design Inspiration
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Screenshots, tags, and replication prompts for your next project.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <TagFilterBar
            tags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            platform={platform}
            onPlatformChange={setPlatform}
            query={query}
            onQueryChange={setQuery}
          />
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-8 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + Add inspiration
        </button>
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : (
        <ItemList items={visibleItems} />
      )}

      <AddItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(item) => setItems((prev) => [item, ...prev])}
      />
    </div>
  );
}
