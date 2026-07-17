import "#src/config/env.ts";
import app from "#src/app.js";
import request from "supertest";
import { postgres } from "#src/config/postgres.js";
import { mongo } from "#src/config/mongo.js";
import fs from "fs";

const api = request(app);

let accessToken: string;
let productId: string;
const email = "reviewuser@test.com";

beforeAll(async () => {
  await postgres.refreshToken.deleteMany({});
  await postgres.user.deleteMany({});
  await mongo
    .collection("products")
    .drop()
    .catch(() => {});
  await mongo
    .collection("reviews")
    .drop()
    .catch(() => {});
  await mongo
    .collection("files")
    .drop()
    .catch(() => {});
  await mongo
    .collection("carts")
    .drop()
    .catch(() => {});
});

afterAll(async () => {
  const allFiles = await mongo.collection("files").find({}).toArray();
  for (const f of allFiles) {
    try {
      await fs.promises.unlink(f.path);
    } catch {
      // ignore
    }
  }
});

describe("Review workflow: create product → write reviews → list sorted", () => {
  it("Step 1: registers and logs in", async () => {
    await api.post("/auth/register").send({
      username: "reviewuser",
      email,
      password: "password123",
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email, password: "password123" });

    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.accessToken;
  });

  it("Step 2: creates a product to review", async () => {
    const uploadRes = await api
      .post("/image")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("image", Buffer.from("review-img"), "review.png");
    const filename = uploadRes.body.filename;

    const res = await api
      .post("/product")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        productName: "Reviewable Product",
        price: 14.99,
        imageFilename: filename,
        details: {},
        description: "For review E2E",
      });

    expect(res.status).toBe(201);
    productId = res.body.id;
  });

  it("Step 3: writes a 5-star review", async () => {
    const res = await api
      .post("/review")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, rating: 5, comment: "Excellent product!" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("Step 4: lists reviews and sees one review", async () => {
    const res = await api.get(`/review/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].rating).toBe(5);
    expect(res.body.reviews[0].comment).toBe("Excellent product!");
  });

  it("Step 5: writes a 3-star review", async () => {
    const res = await api
      .post("/review")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, rating: 3, comment: "It's okay." });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("Step 6: lists reviews again — newest first, both present", async () => {
    const res = await api.get(`/review/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(2);
    // Newest first
    expect(res.body.reviews[0].rating).toBe(3);
    expect(res.body.reviews[0].comment).toBe("It's okay.");
    expect(res.body.reviews[1].rating).toBe(5);
    expect(res.body.reviews[1].comment).toBe("Excellent product!");
  });
});
