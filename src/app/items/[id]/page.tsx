import { AppwriteException } from "node-appwrite";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDatabases } from "@/lib/appwrite/client";
import { appwriteConfig } from "@/lib/appwrite/config";
import { mapDocumentToItem, type ItemDocument } from "@/lib/items";
import { CopyButton } from "@/components/CopyButton";
import { DeleteItemButton } from "@/components/DeleteItemButton";
import { RegenerateButton } from "@/components/RegenerateButton";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let item;
  try {
    const document = await getDatabases().getDocument<ItemDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.itemsCollectionId,
      id,
    );
    item = mapDocumentToItem(document);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      notFound();
    }
    throw error;
  }

  const notes = [item.description, item.replicationPrompt].filter(Boolean).join("\n\n");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="label transition-colors hover:text-ink">
            ← Archive
          </Link>
          <DeleteItemButton id={item.id} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 pb-24 pt-12">
        <div>
          <span className="label">{item.sourceUrl ? item.sourcePlatform : "uploaded"}</span>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
            {item.title}
          </h1>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block max-w-full truncate border-b border-line-strong pb-0.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              {item.sourceUrl}
            </a>
          )}
        </div>

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-sunken ring-1 ring-line">
          <Image
            src={item.screenshotUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            className="object-cover object-top"
            unoptimized
          />
        </div>

        <div className="grid gap-10 border-t border-line pt-10 lg:grid-cols-[1fr_220px] lg:gap-14">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="label">Design notes</h2>
              <div className="flex items-center gap-3">
                <RegenerateButton id={item.id} label={notes ? "Regenerate" : "Generate breakdown"} />
                {notes && <CopyButton text={notes} label="Copy notes" />}
              </div>
            </div>

            {item.description && (
              <p className="max-w-prose text-[0.9375rem] leading-[1.7] text-ink-soft">
                {item.description}
              </p>
            )}

            {notes ? (
              <pre className="mt-1 max-h-96 overflow-auto whitespace-pre-wrap rounded-sm bg-sunken p-5 font-mono text-[0.8125rem] leading-relaxed text-ink ring-1 ring-line">
                {item.replicationPrompt || "No prompt generated yet."}
              </pre>
            ) : (
              <p className="text-sm leading-relaxed text-ink-faint">
                The AI breakdown for this one came back empty — usually a hiccup during upload.
                Generating it again will read the saved screenshot and write fresh notes, tags and a
                palette.
              </p>
            )}
          </section>

          <aside className="flex flex-col gap-8">
            {item.tags.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="label">Design language</h2>
                <ul className="flex flex-col gap-1.5">
                  {item.tags.map((tag) => (
                    <li key={tag} className="text-sm text-ink-soft">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.colorPalette.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="label">Palette</h2>
                <ul className="flex flex-col gap-2">
                  {item.colorPalette.map((color) => (
                    <li key={color} className="flex items-center gap-3">
                      <span
                        className="h-6 w-6 shrink-0 rounded-sm ring-1 ring-line"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-mono text-xs uppercase text-ink-soft">{color}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
