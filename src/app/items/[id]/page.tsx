import { AppwriteException } from "node-appwrite";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDatabases } from "@/lib/appwrite/client";
import { appwriteConfig } from "@/lib/appwrite/config";
import { mapDocumentToItem, type ItemDocument } from "@/lib/items";
import { CopyButton } from "@/components/CopyButton";
import { DeleteItemButton } from "@/components/DeleteItemButton";

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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
        ← Back to dashboard
      </Link>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={item.screenshotUrl}
          alt={item.title}
          fill
          sizes="100vw"
          className="object-cover object-top"
          unoptimized
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h1>
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              {item.sourceUrl}
            </a>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Uploaded image</p>
          )}
        </div>
        <DeleteItemButton id={item.id} />
      </div>

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

      {item.colorPalette.length > 0 && (
        <div className="flex items-center gap-2">
          {item.colorPalette.map((color) => (
            <div key={color} className="flex flex-col items-center gap-1">
              <div
                className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-700"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-zinc-400">{color}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Replication prompt</h2>
          <CopyButton text={item.replicationPrompt} />
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-100 p-4 font-mono text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {item.replicationPrompt || "No prompt generated yet."}
        </pre>
      </div>
    </div>
  );
}
