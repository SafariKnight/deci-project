import "#src/config/index.ts";
import { mongo } from '#src/config/mongo.js';
import { ObjectId } from "mongodb";
import { createReview, getReviewsByProduct } from './reviewService.js';
import { ERROR_CODES } from '#src/utils/errorCodes.js';
import { Product } from "#src/types.js";

const productsDb = mongo.collection<Product>("products");
const reviewsDb = mongo.collection("reviews");

beforeEach(async () => {
  await productsDb.drop({});
  await reviewsDb.drop({});
});

async function seedProduct(): Promise<string> {
  const result = await productsDb.insertOne({
    name: "Test Product",
    price: 19.99,
    description: "Test",
    owner: 1,
    details: {},
    imageFilename: "",
    uploadedAt: Date.now(),
  });
  return result.insertedId.toString();
}

describe("createReview", () => {
  it("creates a review and returns an ObjectId", async () => {
    const productId = await seedProduct();

    const result = await createReview({
      productId,
      userId: 1,
      username: "testuser",
      rating: 5,
      comment: "Great product!",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.id).toBeInstanceOf(ObjectId);
    }
  });

  it("stores the review in the database", async () => {
    const productId = await seedProduct();

    const result = await createReview({
      productId,
      userId: 1,
      username: "testuser",
      rating: 4,
      comment: "Nice!",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const stored = await reviewsDb.findOne({ _id: result.id });
    expect(stored).toBeDefined();
    expect(stored!.productId).toBe(productId);
    expect(stored!.rating).toBe(4);
    expect(stored!.comment).toBe("Nice!");
    expect(stored!.createdAt).toBeDefined();
    expect(typeof stored!.createdAt).toBe("number");
  });

  it("returns PRODUCT_NOT_FOUND when product doesn't exist", async () => {
    const result = await createReview({
      productId: new ObjectId().toString(),
      userId: 1,
      username: "testuser",
      rating: 3,
      comment: "Okay",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(ERROR_CODES.REVIEW.PRODUCT_NOT_FOUND);
    }
  });
});

describe("getReviewsByProduct", () => {
  it("returns reviews for a product sorted by newest first", async () => {
    const productId = await seedProduct();

    await reviewsDb.insertOne({
      productId,
      userId: 1,
      rating: 3,
      comment: "Old review",
      createdAt: 1000,
    });
    await reviewsDb.insertOne({
      productId,
      userId: 2,
      rating: 5,
      comment: "New review",
      createdAt: 2000,
    });

    const result = await getReviewsByProduct(productId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0].comment).toBe("New review");
      expect(result.reviews[1].comment).toBe("Old review");
    }
  });

  it("returns empty array when product has no reviews", async () => {
    const result = await getReviewsByProduct(new ObjectId().toString());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reviews).toEqual([]);
    }
  });
});
