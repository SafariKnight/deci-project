import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';
import fs from "fs";

const api = request(app);

let accessToken: string;
let productId: string;
const email = "prod@test.com";

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

describe("Product lifecycle: create → read → update → list → delete → gone", () => {
  it("Step 1: registers and logs in", async () => {
    await api.post("/auth/register").send({
      username: "produser",
      email,
      password: "password123",
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email, password: "password123" });

    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.accessToken;
  });

  it("Step 2: uploads an image", async () => {
    const res = await api
      .post("/image")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("image", Buffer.from("test-image"), "test.png");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("filename");
  });

  it("Step 3: creates a product", async () => {
    const uploadRes = await api
      .post("/image")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("image", Buffer.from("another-image"), "product.png");
    const filename = uploadRes.body.filename;

    const res = await api
      .post("/product")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        productName: "E2E Test Product",
        price: 39.99,
        imageFilename: filename,
        details: { color: "blue", size: "L" },
        description: "Created during E2E test",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    productId = res.body.id;
  });

  it("Step 4: fetches the product by ID", async () => {
    const res = await api.get(`/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("E2E Test Product");
    expect(res.body.price).toBe(39.99);
    expect(res.body.owner).toBeDefined();
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("_id");
  });

  it("Step 5: updates the product name", async () => {
    const res = await api
      .patch(`/product/${productId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productName: "Updated E2E Product" });

    expect(res.status).toBe(204);
  });

  it("Step 6: verifies the update persisted", async () => {
    const res = await api.get(`/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated E2E Product");
  });

  it("Step 7: lists products and finds it", async () => {
    const res = await api.get("/product");

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(1);
    expect(res.body.products.some((p: any) => p.id === productId)).toBe(true);
  });

  it("Step 8: deletes the product", async () => {
    const res = await api
      .delete(`/product/${productId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });

  it("Step 9: product returns 404 after deletion", async () => {
    const res = await api.get(`/product/${productId}`);

    expect(res.status).toBe(404);
  });
});
