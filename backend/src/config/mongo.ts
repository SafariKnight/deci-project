import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGO_URL;
if (!uri) {
  throw new Error('"MONGO_URL" environtment variable isn\'t provided.');
}

export const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
});

export const mongo = mongoClient.db("db");

process.on("SIGTERM", async () => {
  await mongoClient.close();
});

process.on("SIGINT", async () => {
  await mongoClient.close();
});
