import Image from "next/image";
import Link from "next/link";
import type { DesignItem } from "@/types/item";
import { CopyButton } from "./CopyButton";

const PLATFORM_STYLES: Record<string, string> = {
  dribbble: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  pinterest: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  awwwards: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  other: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
};

export function ItemRow({ item }: { item: DesignItem }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row"
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 sm:h-32 sm:w-52">
        <Image
          src={item.screenshotUrl}
          alt={item.title}
          fill
          sizes="(min-width: 640px) 208px, 100vw"
          className="object-cover object-top transition-transform group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</h3>
          <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-400">
            <span
              className={`rounded-full px-2 py-0.5 font-medium capitalize ${PLATFORM_STYLES[item.sourcePlatform] ?? PLATFORM_STYLES.other}`}
            >
              {item.sourceUrl ? item.sourcePlatform : "uploaded"}
            </span>
          </div>
        </div>

        {item.description && (
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{item.description}</p>
            <CopyButton text={item.description} label="Copy" />
          </div>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.replicationPrompt && (
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{item.replicationPrompt}</p>
            <CopyButton text={item.replicationPrompt} label="Copy" />
          </div>
        )}

        {item.colorPalette.length > 0 && (
          <div className="flex items-center gap-1.5">
            {item.colorPalette.map((color) => (
              <span
                key={color}
                title={color}
                className="h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-700"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
