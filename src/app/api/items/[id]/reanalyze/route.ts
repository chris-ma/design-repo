import { AppwriteException } from "node-appwrite";
import { NextResponse } from "next/server";
import { getDatabases, getStorage } from "@/lib/appwrite/client";
import { appwriteConfig } from "@/lib/appwrite/config";
import { analyzeScreenshot } from "@/lib/ai";
import { mapDocumentToItem, type ItemDocument } from "@/lib/items";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = Promise<{ id: string }>;

function toMediaType(mimeType: string): "image/png" | "image/jpeg" {
  // Uploads are restricted to PNG/JPEG, so anything else means stored metadata
  // we don't recognise — PNG is the safe assumption for a captured screenshot.
  return mimeType === "image/jpeg" || mimeType === "image/jpg" ? "image/jpeg" : "image/png";
}

/**
 * Re-runs the AI breakdown for an item that already has a stored screenshot.
 * Used to recover items whose original analysis failed and were saved with
 * empty tags/description/prompt.
 */
export async function POST(_request: Request, { params }: { params: Params }) {
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

  const storage = getStorage();

  let screenshot: Buffer;
  let mediaType: "image/png" | "image/jpeg";
  try {
    const file = await storage.getFile(appwriteConfig.screenshotsBucketId, document.screenshot_file_id);
    mediaType = toMediaType(file.mimeType);
    const bytes = await storage.getFileDownload(
      appwriteConfig.screenshotsBucketId,
      document.screenshot_file_id,
    );
    screenshot = Buffer.from(bytes as ArrayBuffer);
  } catch (error) {
    console.error("Could not read the stored screenshot", error);
    return NextResponse.json(
      { error: "Could not read the stored screenshot for this item." },
      { status: 502 },
    );
  }

  let analysis;
  try {
    analysis = await analyzeScreenshot({
      imageBase64: screenshot.toString("base64"),
      mediaType,
      sourceUrl: document.source_url || undefined,
    });
  } catch (error) {
    console.error("AI re-analysis failed", error);
    return NextResponse.json(
      { error: "The AI analysis failed again. Please try once more in a moment." },
      { status: 502 },
    );
  }

  const updated = await databases.updateDocument<ItemDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.itemsCollectionId,
    id,
    {
      title: analysis.title || document.title,
      description: analysis.description,
      tags: analysis.tags,
      replication_prompt: analysis.replicationPrompt,
      color_palette: analysis.colorPalette,
    },
  );

  return NextResponse.json({ item: mapDocumentToItem(updated) });
}
