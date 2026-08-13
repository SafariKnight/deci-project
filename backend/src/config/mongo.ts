import { MongoClient } from "mongodb";

const baseUri = process.env.MONGO_URL;
if (!baseUri) {
  throw new Error('"MONGO_URL" environtment variable isn\'t provided.');
}

let uri = baseUri;
if (!uri.includes("retryWrites")) {
  uri += (uri.includes("?") ? "&" : "?") + "retryWrites=true&w=majority";
}

function createClient(): MongoClient {
  return new MongoClient(uri);
}

let mongoClient: MongoClient;

if (process.env.NODE_ENV === "production") {
  ;(global as any).__MONGO_CLIENT = (global as any).__MONGO_CLIENT || createClient();
  mongoClient = (global as any).__MONGO_CLIENT;
} else {
  mongoClient = createClient();
}

export const mongo = mongoClient.db("db");

export async function closeMongoClient() {
  if (process.env.NODE_ENV !== "production") {
    await mongoClient.close();
  }
}