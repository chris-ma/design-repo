import type { Models } from "node-appwrite";
import { getScreenshotViewUrl } from "@/lib/appwrite/config";
import type { DesignItem, SourcePlatform } from "@/types/item";

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/,
  /^169\.254\./,
];

export class InvalidUrlError extends Error {}

export function validateSourceUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new InvalidUrlError("Please provide a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidUrlError("Only http and https URLs are supported.");
  }

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new InvalidUrlError("URLs pointing to local/private addresses are not allowed.");
  }

  return url;
}

export function deriveSourcePlatform(url: URL): SourcePlatform {
  const host = url.hostname.replace(/^www\./, "");
  if (host.endsWith("dribbble.com")) return "dribbble";
  if (host.endsWith("pinterest.com") || host.endsWith("pin.it")) return "pinterest";
  if (host.endsWith("awwwards.com")) return "awwwards";
  return "other";
}

export interface ItemDocument extends Models.Document {
  source_url: string;
  source_platform: SourcePlatform;
  title: string;
  screenshot_file_id: string;
  tags: string[];
  replication_prompt: string;
  color_palette: string[];
  created_at: string;
}

export function mapDocumentToItem(doc: ItemDocument): DesignItem {
  return {
    id: doc.$id,
    sourceUrl: doc.source_url,
    sourcePlatform: doc.source_platform,
    title: doc.title,
    screenshotFileId: doc.screenshot_file_id,
    screenshotUrl: getScreenshotViewUrl(doc.screenshot_file_id),
    tags: doc.tags ?? [],
    replicationPrompt: doc.replication_prompt,
    colorPalette: doc.color_palette ?? [],
    createdAt: doc.created_at,
  };
}
