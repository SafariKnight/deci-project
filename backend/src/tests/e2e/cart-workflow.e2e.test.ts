import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';
import fs from "fs";

const api = request(app);

let accessToken: string;
let productId: string;
const email = "cartuser@test.com";

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

describe("Cart workflow: add → increase → decrease → remove → add → clear", () => {
  it("Step 1: registers and logs in", async () => {
    await api.post("/auth/register").send({
      username: "cartuser",
      email,
      password: "password123",
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email, password: "password123" });

    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.accessToken;
  });

  it("Step 2: creates a product to add to cart", async () => {
    const uploadRes = await api
      .post("/image")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("image", Buffer.from("cart-img"), "cart.png");
    const filename = uploadRes.body.filename;

    const res = await api
      .post("/product")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        productName: "Cart Test Item",
        price: 19.99,
        imageFilename: filename,
        details: {},
        description: "Item for cart E2E",
      });

    expect(res.status).toBe(201);
    productId = res.body.id;
  });

  it("Step 3: adds the product to cart", async () => {
    const res = await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].productId).toBe(productId);
    expect(res.body.products[0].quantity).toBe(1);
  });

  it("Step 4: verifies cart contents via GET", async () => {
    const res = await api
      .get("/cart")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].quantity).toBe(1);
  });

  it("Step 5: increases quantity to 3", async () => {
    const res = await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.products[0].quantity).toBe(3);
  });

  it("Step 6: decreases quantity by 1", async () => {
    const res = await api
      .delete("/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.products[0].quantity).toBe(2);
  });

  it("Step 7: removes the item entirely (quantity matches current)", async () => {
    const res = await api
      .delete("/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });

  it("Step 8: adds the same product again", async () => {
    const res = await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].quantity).toBe(1);
  });

  it("Step 9: clears the entire cart", async () => {
    const res = await api
      .delete("/cart")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const getRes = await api
      .get("/cart")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.body.products).toEqual([]);
  });
});
