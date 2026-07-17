import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';
import { ObjectId } from "mongodb";
import { Product, Review } from "#src/types.js";

const api = request(app);

const productsDb = mongo.collection<Product>("products");
const reviewsDb = mongo.collection<Review>("reviews");

beforeEach(async () => {
  await postgres.refreshToken.deleteMany({});
  await postgres.user.deleteMany({});
  await productsDb.drop().catch(() => {});
  await reviewsDb.drop().catch(() => {});
  await mongo.collection("files").drop().catch(() => {});
  await mongo.collection("carts").drop().catch(() => {});
  await postgres.user.create({
    data: {
      username: "reviewowner",
      email: "reviewowner@test.com",
      password: "dummyhash",
    },
  });
});

// ---- Helpers ---- //

async function registerUser(
  email: string,
  username: string,
  password: string,
) {
  return await api.post("/auth/register").send({ username, email, password });
}

async function login(email: string, password: string) {
  return await api.post("/auth/login").send({ email, password });
}

async function getToken(
  email = "user@test.com",
  username = "user",
  password = "password123",
) {
  await registerUser(email, username, password);
  const res = await login(email, password);
  return res.body.accessToken as string;
}

async function seedProduct(owner: number = 2): Promise<string> {
  const res = await productsDb.insertOne({
    name: "Reviewable Product",
    price: 19.99,
    description: "For review tests",
    owner,
    details: {},
    imageFilename: "",
    uploadedAt: Date.now(),
  });
  return res.insertedId.toString();
}

// ---- Create (protected) ---- //

describe("POST /review", () => {
  it("returns 401 without token", async () => {
    const res = await api.post("/review").send({
      productId: new ObjectId().toString(),
      rating: 5,
      comment: "Great!",
    });

    expect(res.status).toBe(401);
  });

  it("creates a review for an existing product", async () => {
    const productId = await seedProduct();
    const token = await getToken();

    const res = await api
      .post("/review")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, rating: 5, comment: "Excellent!" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 404 for non-existent product", async () => {
    const token = await getToken();

    const res = await api
      .post("/review")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: new ObjectId().toString(),
        rating: 3,
        comment: "Okay",
      });

    expect(res.status).toBe(404);
  });

  it("returns 422 for invalid rating", async () => {
    const productId = await seedProduct();
    const token = await getToken();

    const res = await api
      .post("/review")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, rating: 6, comment: "Too high!" });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 422 for missing fields", async () => {
    const token = await getToken();

    const res = await api
      .post("/review")
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 4 });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ---- List by Product ---- //

describe("GET /review/product/:productId", () => {
  it("returns reviews for a product, newest first", async () => {
    const productId = await seedProduct();
    await reviewsDb.insertOne({
      productId,
      userId: 1,
      username: "user1",
      rating: 3,
      comment: "Older review",
      createdAt: 1000,
    });
    await reviewsDb.insertOne({
      productId,
      userId: 2,
      username: "user2",
      rating: 5,
      comment: "Newer review",
      createdAt: 2000,
    });

    const res = await api.get(`/review/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(2);
    expect(res.body.reviews[0].comment).toBe("Newer review");
    expect(res.body.reviews[1].comment).toBe("Older review");
  });

  it("returns empty array when no reviews exist", async () => {
    const productId = await seedProduct();

    const res = await api.get(`/review/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toEqual([]);
  });
});
