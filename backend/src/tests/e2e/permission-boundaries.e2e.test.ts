import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';
import fs from "fs";

const api = request(app);

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

describe("Permission boundaries: user cannot edit/delete another user's product, admin can", () => {
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  let productId: string;

  it("Step 1: creates user1 and a product", async () => {
    await api.post("/auth/register").send({
      username: "user1",
      email: "user1@test.com",
      password: "password123",
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email: "user1@test.com", password: "password123" });
    user1Token = loginRes.body.accessToken;

    const uploadRes = await api
      .post("/image")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("image", Buffer.from("img"), "prod.png");
    const filename = uploadRes.body.filename;

    const productRes = await api
      .post("/product")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        productName: "User1's Product",
        price: 9.99,
        imageFilename: filename,
        details: {},
        description: "Owned by user1",
      });

    expect(productRes.status).toBe(201);
    productId = productRes.body.id;
  });

  it("Step 2: creates user2 (regular user)", async () => {
    await api.post("/auth/register").send({
      username: "user2",
      email: "user2@test.com",
      password: "password123",
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email: "user2@test.com", password: "password123" });
    user2Token = loginRes.body.accessToken;
  });

  it("Step 3: user2 cannot update user1's product", async () => {
    const res = await api
      .patch(`/product/${productId}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ productName: "Hacked" });

    expect(res.status).toBe(403);
  });

  it("Step 4: user2 cannot delete user1's product", async () => {
    const res = await api
      .delete(`/product/${productId}`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
  });

  it("Step 5: creates an admin user", async () => {
    await api.post("/auth/register").send({
      username: "admin",
      email: "admin@boundaries.com",
      password: "password123",
    });
    await postgres.user.update({
      where: { email: "admin@boundaries.com" },
      data: { role: "ADMIN" },
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email: "admin@boundaries.com", password: "password123" });
    adminToken = loginRes.body.accessToken;
  });

  it("Step 6: admin can update user1's product", async () => {
    const res = await api
      .patch(`/product/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productName: "Admin Updated" });

    expect(res.status).toBe(204);
  });

  it("Step 7: admin can delete user1's product", async () => {
    const res = await api
      .delete(`/product/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it("Step 8: product is gone after admin deletion", async () => {
    const res = await api.get(`/product/${productId}`);

    expect(res.status).toBe(404);
  });
});
