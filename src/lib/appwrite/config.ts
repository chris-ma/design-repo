export const appwriteConfig = {
  get endpoint() {
    return requireEnv("APPWRITE_ENDPOINT");
  },
  get projectId() {
    return requireEnv("APPWRITE_PROJECT_ID");
  },
  get apiKey() {
    return requireEnv("APPWRITE_API_KEY");
  },
  get databaseId() {
    return process.env.APPWRITE_DATABASE_ID || "design-inspo-db";
  },
  get itemsCollectionId() {
    return process.env.APPWRITE_ITEMS_COLLECTION_ID || "items";
  },
  get screenshotsBucketId() {
    return process.env.APPWRITE_SCREENSHOTS_BUCKET_ID || "screenshots";
  },
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export function getScreenshotViewUrl(fileId: string): string {
  const url = new URL(
    `/v1/storage/buckets/${appwriteConfig.screenshotsBucketId}/files/${fileId}/view`,
    appwriteConfig.endpoint.replace(/\/v1\/?$/, ""),
  );
  url.searchParams.set("project", appwriteConfig.projectId);
  return url.toString();
}
