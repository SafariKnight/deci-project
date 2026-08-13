import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  throw new Error("MONGO_URL environment variable is not set");
}

const mongoClient = new MongoClient(MONGO_URL.endsWith("?")
  ? MONGO_URL + "retryWrites=true&w=majority"
  : MONGO_URL + "?retryWrites=true&w=majority"
);

let cachedDb: ReturnType<typeof mongoClient.db> | null = null;

async function getDb() {
  if (!cachedDb) {
    await mongoClient.connect();
    cachedDb = mongoClient.db("db");
  }
  return cachedDb;
}

export default async function handler(req: any, res: any) {
  try {
    const db = await getDb();
    const reviewsCollection = db.collection("reviews");

    const stats = await reviewsCollection.aggregate([
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratings: { $push: "$rating" },
        },
      },
      {
        $addFields: {
          ratingDistribution: {
            "1": { $filter: { input: "$ratings", cond: { $eq: ["$$this", 1] } } },
            "2": { $filter: { input: "$ratings", cond: { $eq: ["$$this", 2] } } },
            "3": { $filter: { input: "$ratings", cond: { $eq: ["$$this", 3] } } },
            "4": { $filter: { input: "$ratings", cond: { $eq: ["$$this", 4] } } },
            "5": { $filter: { input: "$ratings", cond: { $eq: ["$$this", 5] } } },
          },
        },
      },
      {
        $project: {
          productId: "$_id",
          _id: 0,
          averageRating: { $round: ["$averageRating", 2] },
          totalReviews: 1,
          rating1Count: {
            $size: {
              $filter: {
                input: "$ratings",
                cond: { $eq: ["$$this", 1] },
              },
            },
          },
          rating2Count: {
            $size: {
              $filter: {
                input: "$ratings",
                cond: { $eq: ["$$this", 2] },
              },
            },
          },
          rating3Count: {
            $size: {
              $filter: {
                input: "$ratings",
                cond: { $eq: ["$$this", 3] },
              },
            },
          },
          rating4Count: {
            $size: {
              $filter: {
                input: "$ratings",
                cond: { $eq: ["$$this", 4] },
              },
            },
          },
          rating5Count: {
            $size: {
              $filter: {
                input: "$ratings",
                cond: { $eq: ["$$this", 5] },
              },
            },
          },
        },
      },
    ]).toArray();

    res.status(200).json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error aggregating reviews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to aggregate review statistics",
    });
  }
}
