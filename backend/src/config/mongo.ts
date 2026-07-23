import { MongoClient } from "mongodb";

let uri = process.env.MONGO_URL;
if (!uri) {
  throw new Error('"MONGO_URL" environtment variable isn\'t provided.');
}

if (!uri.includes("retryWrites")) {
  uri += (uri.includes("?") ? "&" : "?") + "retryWrites=true&w=majority";
}

export const mongoClient = new MongoClient(uri);

export const mongo = mongoClient.db("db");

process.on("SIGTERM", async () => {
  await mongoClient.close();
});

process.on("SIGINT", async () => {
  await mongoClient.close();
});