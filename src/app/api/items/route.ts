import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { NextRequest, NextResponse } from "next/server";
import { getDatabases, getStorage } from "@/lib/appwrite/client";
import { appwriteConfig } from "@/lib/appwrite/config";
import { analyzeScreenshot } from "@/lib/ai";
import { deriveSourcePlatform, InvalidUrlError, mapDocumentToItem, validateSourceUrl, type ItemDocument } from "@/lib/items";
import { captureScreenshot } from "@/lib/screenshot";
import type { CreateItemResponse, SourcePlatform } from "@/types/item";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_UPLOAD_TYPES: Record<string, "image/png" | "image/jpeg"> = {
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
};
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stays under Vercel's serverless request body limit

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
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return handleImageUpload(request);
  }
  return handleUrlSubmission(request);
}

async function handleUrlSubmission(request: NextRequest) {
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

  return createItemRecord({
    screenshot: capture.screenshot,
    mediaType: "image/png",
    filename: "screenshot.png",
    sourceUrl: url.toString(),
    sourcePlatform,
    pageTitle: capture.pageTitle,
    pageDescription: capture.pageDescription,
  });
}

async function handleImageUpload(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }

  const mediaType = ALLOWED_UPLOAD_TYPES[file.type];
  if (!mediaType) {
    return NextResponse.json({ error: "Only PNG and JPEG images are supported." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 4MB)." }, { status: 400 });
  }

  let sourceUrl = "";
  let sourcePlatform: SourcePlatform = "other";
  const rawSourceUrl = formData.get("sourceUrl");
  if (typeof rawSourceUrl === "string" && rawSourceUrl.trim().length > 0) {
    try {
      const url = validateSourceUrl(rawSourceUrl);
      sourceUrl = url.toString();
      sourcePlatform = deriveSourcePlatform(url);
    } catch (error) {
      if (error instanceof InvalidUrlError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  }

  const screenshot = Buffer.from(await file.arrayBuffer());
  const filename = mediaType === "image/png" ? "upload.png" : "upload.jpg";

  return createItemRecord({
    screenshot,
    mediaType,
    filename,
    sourceUrl,
    sourcePlatform,
  });
}

async function createItemRecord({
  screenshot,
  mediaType,
  filename,
  sourceUrl,
  sourcePlatform,
  pageTitle,
  pageDescription,
}: {
  screenshot: Buffer;
  mediaType: "image/png" | "image/jpeg";
  filename: string;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  pageTitle?: string;
  pageDescription?: string;
}) {
  let analysis;
  let warning: string | undefined;
  try {
    analysis = await analyzeScreenshot({
      imageBase64: screenshot.toString("base64"),
      mediaType,
      pageTitle,
      pageDescription,
      sourceUrl: sourceUrl || undefined,
    });
  } catch (error) {
    console.error("AI analysis failed", error);
    warning = "Screenshot saved, but AI tagging/prompt generation failed. You can retry analysis later.";
    analysis = {
      title: pageTitle || "Untitled inspiration",
      description: "",
      tags: [] as string[],
      colorPalette: [] as string[],
      replicationPrompt: "",
    };
  }

  const storage = getStorage();
  const uploadedFile = await storage.createFile(
    appwriteConfig.screenshotsBucketId,
    ID.unique(),
    InputFile.fromBuffer(screenshot, filename),
  );

  const now = new Date().toISOString();
  const document = await getDatabases().createDocument<ItemDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.itemsCollectionId,
    ID.unique(),
    {
      source_url: sourceUrl,
      source_platform: sourcePlatform,
      title: analysis.title || pageTitle || "Untitled inspiration",
      description: analysis.description,
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
