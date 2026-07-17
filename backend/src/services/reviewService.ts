import { mongo } from '#src/config/mongo.js';
import { Review } from "#src/types.js";
import { MongoError, ObjectId } from "mongodb";
import { ERROR_CODES, Result } from '#src/utils/errorCodes.js';
import { getProductById } from './productService.js';

const db = mongo.collection<Review>("reviews");

export async function createReview(
  review: Omit<Review, "createdAt">,
): Promise<Result<{ id: ObjectId }>> {
  const productResult = await getProductById(new ObjectId(review.productId));
  if (!productResult.ok) {
    return { ok: false, error: ERROR_CODES.REVIEW.PRODUCT_NOT_FOUND };
  }

  try {
    const result = await db.insertOne({
      ...review,
      createdAt: Date.now(),
    });
    return { ok: true, id: result.insertedId };
  } catch (error) {
    if (error instanceof MongoError) {
      return { ok: false, error: ERROR_CODES.REVIEW.DATABASE_ERROR };
    }
    return { ok: false, error: ERROR_CODES.REVIEW.INVALID_DATA };
  }
}

export async function getReviewsByProduct(
  productId: string,
): Promise<Result<{ reviews: Review[] }>> {
  const reviews = await db
    .find({ productId })
    .sort({ createdAt: -1 })
    .toArray();
  return { ok: true, reviews };
}
