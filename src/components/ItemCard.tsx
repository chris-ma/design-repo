import Image from "next/image";
import Link from "next/link";
import type { DesignItem } from "@/types/item";

const PLATFORM_STYLES: Record<string, string> = {
  dribbble: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  pinterest: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  awwwards: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  other: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
};

export function ItemCard({ item }: { item: DesignItem }) {
  const visibleTags = item.tags.slice(0, 4);
  const remainingTagCount = item.tags.length - visibleTags.length;

  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={item.screenshotUrl}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 font-medium text-zinc-900 dark:text-zinc-100">{item.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLATFORM_STYLES[item.sourcePlatform] ?? PLATFORM_STYLES.other}`}
          >
            {item.sourcePlatform}
          </span>
        </div>
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {remainingTagCount > 0 && (
              <span className="rounded-md px-2 py-0.5 text-xs text-zinc-400">+{remainingTagCount} more</span>
            )}
          </div>
        )}
        {item.replicationPrompt && (
          <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{item.replicationPrompt}</p>
        )}
      </div>
    </Link>
  );
}
