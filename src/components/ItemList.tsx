import type { DesignItem } from "@/types/item";
import { ItemRow } from "./ItemRow";

export function ItemList({ items }: { items: DesignItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 py-24 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">No inspiration saved yet.</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Paste a Dribbble, Pinterest, or Awwwards link to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}
