import { AppwriteException } from "node-appwrite";
import { NextResponse } from "next/server";
import { getDatabases, getStorage } from "@/lib/appwrite/client";
import { appwriteConfig } from "@/lib/appwrite/config";
import { mapDocumentToItem, type ItemDocument } from "@/lib/items";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;

  try {
    const document = await getDatabases().getDocument<ItemDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.itemsCollectionId,
      id,
    );
    return NextResponse.json({ item: mapDocumentToItem(document) });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const databases = getDatabases();

  let document: ItemDocument;
  try {
    document = await databases.getDocument<ItemDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.itemsCollectionId,
      id,
    );
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    throw error;
  }

  await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.itemsCollectionId, id);

  // Best-effort: an orphaned storage file is harmless, unlike a document with a dangling file reference.
  await getStorage()
    .deleteFile(appwriteConfig.screenshotsBucketId, document.screenshot_file_id)
    .catch((error) => console.error("Failed to delete screenshot file", error));

  return NextResponse.json({ success: true });
}
