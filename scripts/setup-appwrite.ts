import { AppwriteException, Client, Databases, DatabasesIndexType, Permission, Role, Storage } from "node-appwrite";

const ENDPOINT = requireEnv("APPWRITE_ENDPOINT");
const PROJECT_ID = requireEnv("APPWRITE_PROJECT_ID");
const API_KEY = requireEnv("APPWRITE_API_KEY");
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "design-inspo-db";
const COLLECTION_ID = process.env.APPWRITE_ITEMS_COLLECTION_ID || "items";
const BUCKET_ID = process.env.APPWRITE_SCREENSHOTS_BUCKET_ID || "screenshots";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing ${name}. Copy .env.example to .env.local, fill in your Appwrite credentials, then re-run: npm run setup`,
    );
    process.exit(1);
  }
  return value;
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);

async function isNotFound(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return true;
    throw error;
  }
}

async function ignoreConflict(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
    console.log(`  created: ${label}`);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 409) {
      console.log(`  already exists: ${label}`);
      return;
    }
    throw error;
  }
}

async function waitForAttributeAvailable(key: string, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const attribute = (await databases.getAttribute(DATABASE_ID, COLLECTION_ID, key)) as { status: string };
    if (attribute.status === "available") return;
    if (attribute.status === "failed") {
      throw new Error(`Attribute "${key}" failed to provision.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for attribute "${key}" to become available.`);
}

async function main() {
  console.log(`Provisioning Appwrite project ${PROJECT_ID} at ${ENDPOINT}\n`);

  console.log("Database:");
  const dbMissing = await isNotFound(() => databases.get(DATABASE_ID));
  if (dbMissing) {
    await ignoreConflict(() => databases.create(DATABASE_ID, "Design Inspiration Dashboard"), DATABASE_ID);
  } else {
    console.log(`  already exists: ${DATABASE_ID}`);
  }

  console.log("\nCollection:");
  const collectionMissing = await isNotFound(() => databases.getCollection(DATABASE_ID, COLLECTION_ID));
  if (collectionMissing) {
    await ignoreConflict(() => databases.createCollection(DATABASE_ID, COLLECTION_ID, "Items"), COLLECTION_ID);
  } else {
    console.log(`  already exists: ${COLLECTION_ID}`);
  }

  console.log("\nAttributes:");
  const existingAttributes = new Set(
    (await databases.listAttributes(DATABASE_ID, COLLECTION_ID)).attributes.map(
      (attribute) => (attribute as { key: string }).key,
    ),
  );

  const attributeJobs: Array<{ key: string; create: () => Promise<unknown> }> = [
    { key: "source_url", create: () => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "source_url", 2000, true) },
    {
      key: "source_platform",
      create: () =>
        databases.createEnumAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          "source_platform",
          ["dribbble", "pinterest", "awwwards", "other"],
          true,
        ),
    },
    { key: "title", create: () => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "title", 300, true) },
    {
      key: "description",
      create: () => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "description", 5000, false),
    },
    {
      key: "screenshot_file_id",
      create: () => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "screenshot_file_id", 100, true),
    },
    {
      key: "tags",
      create: () => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "tags", 100, false, undefined, true),
    },
    {
      key: "replication_prompt",
      create: () => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "replication_prompt", 20000, true),
    },
    {
      key: "color_palette",
      create: () =>
        databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "color_palette", 20, false, undefined, true),
    },
    { key: "created_at", create: () => databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, "created_at", true) },
  ];

  for (const job of attributeJobs) {
    if (existingAttributes.has(job.key)) {
      console.log(`  already exists: ${job.key}`);
      continue;
    }
    await job.create();
    console.log(`  created: ${job.key} (waiting for it to become available...)`);
    await waitForAttributeAvailable(job.key);
  }

  console.log("\nIndexes:");
  const existingIndexes = new Set(
    (await databases.listIndexes(DATABASE_ID, COLLECTION_ID)).indexes.map((index) => (index as { key: string }).key),
  );

  const indexJobs: Array<{ key: string; create: () => Promise<unknown> }> = [
    {
      key: "idx_source_platform",
      create: () =>
        databases.createIndex(DATABASE_ID, COLLECTION_ID, "idx_source_platform", DatabasesIndexType.Key, [
          "source_platform",
        ]),
    },
    {
      key: "idx_tags",
      create: () => databases.createIndex(DATABASE_ID, COLLECTION_ID, "idx_tags", DatabasesIndexType.Key, ["tags"]),
    },
  ];

  for (const job of indexJobs) {
    if (existingIndexes.has(job.key)) {
      console.log(`  already exists: ${job.key}`);
      continue;
    }
    await job.create();
    console.log(`  created: ${job.key}`);
  }

  console.log("\nStorage bucket:");
  const bucketMissing = await isNotFound(() => storage.getBucket(BUCKET_ID));
  if (bucketMissing) {
    await ignoreConflict(
      () =>
        storage.createBucket(
          BUCKET_ID,
          "Screenshots",
          [Permission.read(Role.any())],
          false,
          true,
          10 * 1024 * 1024,
          ["png", "jpg", "jpeg"],
        ),
      BUCKET_ID,
    );
  } else {
    console.log(`  already exists: ${BUCKET_ID}`);
  }

  console.log("\nDone. Make sure your .env.local has:\n");
  console.log(`APPWRITE_ENDPOINT=${ENDPOINT}`);
  console.log(`APPWRITE_PROJECT_ID=${PROJECT_ID}`);
  console.log(`APPWRITE_API_KEY=${"*".repeat(8)} (kept secret)`);
  console.log(`APPWRITE_DATABASE_ID=${DATABASE_ID}`);
  console.log(`APPWRITE_ITEMS_COLLECTION_ID=${COLLECTION_ID}`);
  console.log(`APPWRITE_SCREENSHOTS_BUCKET_ID=${BUCKET_ID}`);
}

main().catch((error) => {
  console.error("\nSetup failed:", error);
  process.exit(1);
});
