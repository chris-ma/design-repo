import { Client, Databases, Storage } from "node-appwrite";
import { appwriteConfig } from "./config";

let client: Client | undefined;

function getClient(): Client {
  if (!client) {
    client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setKey(appwriteConfig.apiKey);
  }
  return client;
}

let databases: Databases | undefined;
export function getDatabases(): Databases {
  if (!databases) {
    databases = new Databases(getClient());
  }
  return databases;
}

let storage: Storage | undefined;
export function getStorage(): Storage {
  if (!storage) {
    storage = new Storage(getClient());
  }
  return storage;
}
