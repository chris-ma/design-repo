import Image from "next/image";
import Link from "next/link";
import type { DesignItem } from "@/types/item";
import { CopyButton } from "./CopyButton";
import { RegenerateButton } from "./RegenerateButton";

export function ItemRow({
  item,
  index,
  onUpdated,
}: {
  item: DesignItem;
  index: number;
  onUpdated?: (item: DesignItem) => void;
}) {
  const notes = [item.description, item.replicationPrompt].filter(Boolean).join("\n\n");

  return (
    <li>
      <Link
        href={`/items/${item.id}`}
        className="group flex flex-col gap-5 py-7 sm:flex-row sm:gap-7"
      >
        <span className="label hidden w-8 shrink-0 pt-1 tabular-nums lg:block">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-sm bg-sunken ring-1 ring-line sm:aspect-auto sm:h-[168px] sm:w-[268px]">
          <Image
            src={item.screenshotUrl}
            alt={item.title}
            fill
            sizes="(min-width: 640px) 268px, 100vw"
            className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            unoptimized
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-2xl leading-snug text-ink transition-colors group-hover:text-accent">
              {item.title}
            </h3>
            <span className="label shrink-0">{item.sourceUrl ? item.sourcePlatform : "uploaded"}</span>
          </div>

          {notes ? (
            <p className="line-clamp-2 max-w-prose text-sm leading-relaxed text-ink-soft">{notes}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-ink-faint">No breakdown was generated for this one.</p>
              <RegenerateButton id={item.id} label="Generate breakdown" onUpdated={onUpdated} />
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
            {item.colorPalette.length > 0 && (
              <div className="flex h-4 overflow-hidden rounded-full ring-1 ring-line">
                {item.colorPalette.map((color) => (
                  <span
                    key={color}
                    title={color}
                    className="h-full w-6"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {/* Lowercase sans keeps the mono caps reserved for metadata labels. */}
            {item.tags.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
                {item.tags.slice(0, 4).map((tag, i) => (
                  <span key={tag} className="flex items-center gap-2">
                    {i > 0 && <span aria-hidden>·</span>}
                    {tag}
                  </span>
                ))}
                {item.tags.length > 4 && <span>· +{item.tags.length - 4}</span>}
              </div>
            )}

            {/* Always reachable on touch; fades in on hover only where a pointer exists. */}
            {notes && (
              <div className="ml-auto transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <CopyButton text={notes} label="Copy notes" />
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
