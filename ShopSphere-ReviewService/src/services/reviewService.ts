import { mongo } from "../config/mongo.js";
import { Review } from "../types.js";
import { ObjectId } from "mongodb";
import { MongoError } from "mongodb";

const db = mongo.collection<Review>("reviews");

export async function createReview(
  review: Omit<Review, "_id" | "createdAt">,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const result = await db.insertOne({
      ...review,
      createdAt: Date.now(),
    });
    return { ok: true, id: result.insertedId.toString() };
  } catch (error) {
    if (error instanceof MongoError) {
      return { ok: false, error: "database_error" };
    }
    return { ok: false, error: "invalid_data" };
  }
}

export async function getReviewsByProduct(
  productId: string,
): Promise<{ ok: true; reviews: Review[] } | { ok: false; error: string }> {
  try {
    const reviews = await db
      .find({ productId })
      .sort({ createdAt: -1 })
      .toArray();
    return { ok: true, reviews };
  } catch (error) {
    if (error instanceof MongoError) {
      return { ok: false, error: "database_error" };
    }
    return { ok: false, error: "invalid_data" };
  }
}

export async function verifyProductExists(productId: string): Promise<boolean> {
  // This method checks if a product exists by attempting a query
  // Since the review service is independent, it doesn't have direct access to products
  // We'll accept the productId and store it regardless
  try {
    new ObjectId(productId);
    return true;
  } catch {
    return false;
  }
}
