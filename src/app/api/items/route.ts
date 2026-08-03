import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { NextRequest, NextResponse } from "next/server";
import { getDatabases, getStorage } from "@/lib/appwrite/client";
import { appwriteConfig } from "@/lib/appwrite/config";
import { analyzeScreenshot } from "@/lib/ai";
import { deriveSourcePlatform, InvalidUrlError, mapDocumentToItem, validateSourceUrl, type ItemDocument } from "@/lib/items";
import { captureScreenshot } from "@/lib/screenshot";
import type { CreateItemResponse } from "@/types/item";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform");
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam
    ? tagsParam.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  const queries = [Query.orderDesc("created_at"), Query.limit(100)];
  if (platform) queries.push(Query.equal("source_platform", platform));
  if (tags.length > 0) queries.push(Query.containsAny("tags", tags));

  const result = await getDatabases().listDocuments<ItemDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.itemsCollectionId,
    queries,
  );

  return NextResponse.json({ items: result.documents.map(mapDocumentToItem) });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const rawUrl = typeof body === "object" && body !== null ? (body as Record<string, unknown>).url : undefined;
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return NextResponse.json({ error: "A `url` field is required." }, { status: 400 });
  }

  let url: URL;
  try {
    url = validateSourceUrl(rawUrl);
  } catch (error) {
    if (error instanceof InvalidUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const sourcePlatform = deriveSourcePlatform(url);

  let capture;
  try {
    capture = await captureScreenshot(url.toString());
  } catch (error) {
    console.error("Screenshot capture failed", error);
    return NextResponse.json(
      { error: `Could not capture a screenshot of that URL: ${(error as Error).message}` },
      { status: 502 },
    );
  }

  let analysis;
  let warning: string | undefined;
  try {
    analysis = await analyzeScreenshot({
      imageBase64: capture.screenshot.toString("base64"),
      mediaType: "image/png",
      pageTitle: capture.pageTitle,
      pageDescription: capture.pageDescription,
      sourceUrl: url.toString(),
    });
  } catch (error) {
    console.error("AI analysis failed", error);
    warning = "Screenshot saved, but AI tagging/prompt generation failed. You can retry analysis later.";
    analysis = {
      title: capture.pageTitle,
      tags: [] as string[],
      colorPalette: [] as string[],
      replicationPrompt: "",
    };
  }

  const storage = getStorage();
  const uploadedFile = await storage.createFile(
    appwriteConfig.screenshotsBucketId,
    ID.unique(),
    InputFile.fromBuffer(capture.screenshot, "screenshot.png"),
  );

  const now = new Date().toISOString();
  const document = await getDatabases().createDocument<ItemDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.itemsCollectionId,
    ID.unique(),
    {
      source_url: url.toString(),
      source_platform: sourcePlatform,
      title: analysis.title || capture.pageTitle,
      screenshot_file_id: uploadedFile.$id,
      tags: analysis.tags,
      replication_prompt: analysis.replicationPrompt,
      color_palette: analysis.colorPalette,
      created_at: now,
    },
  );

  const response: CreateItemResponse = { item: mapDocumentToItem(document), warning };
  return NextResponse.json(response, { status: 201 });
}
