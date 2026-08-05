import type { DesignItem } from "@/types/item";
import { ItemRow } from "./ItemRow";

export function ItemList({
  items,
  onItemUpdated,
}: {
  items: DesignItem[];
  onItemUpdated?: (item: DesignItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border-y border-line py-28 text-center">
        <p className="font-display text-2xl text-ink">Nothing filed yet</p>
        <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
          Paste a link to a site you admire, or upload a screenshot. Everything else gets written
          for you.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item, index) => (
        <ItemRow key={item.id} item={item} index={index} onUpdated={onItemUpdated} />
      ))}
    </ul>
  );
}
