import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URL;
if (!uri) {
  throw new Error('"MONGO_URL" environtment variable isn\'t provided.')
}

export const client = new MongoClient(uri);

export const mongo = client.db("db")
