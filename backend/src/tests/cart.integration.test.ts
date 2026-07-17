import "#src/config/env.ts";
import app from "#src/app.js";
import request from "supertest";
import { postgres } from "#src/config/postgres.js";
import { mongo } from "#src/config/mongo.js";
import { Cart } from "#src/types.js";

const api = request(app);

const cartsDb = mongo.collection<Cart>("carts");

beforeEach(async () => {
  await postgres.refreshToken.deleteMany({});
  await postgres.user.deleteMany({});
  await cartsDb.drop().catch(() => {});
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
  await postgres.user.create({
    data: {
      username: "cartowner",
      email: "cartowner@test.com",
      password: "dummyhash",
    },
  });
});

// ---- Helpers ---- //

async function registerUser(email: string, username: string, password: string) {
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

const testProductId = "507f1f77bcf86cd799439011";

// ---- Get Cart (protected) ---- //

describe("GET /cart", () => {
  it("returns 401 without token", async () => {
    const res = await api.get("/cart");

    expect(res.status).toBe(401);
  });

  it("auto-creates and returns an empty cart", async () => {
    const token = await getToken();

    const res = await api.get("/cart").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("userId");
    expect(res.body.products).toEqual([]);
  });

  it("returns existing cart with items", async () => {
    const token = await getToken("cartreturn@test.com", "cartreturn");
    await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    const res = await api.get("/cart").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].productId).toBe(testProductId);
    expect(res.body.products[0].quantity).toBe(1);
  });
});

// ---- Add Item (protected) ---- //

describe("POST /cart/items", () => {
  it("returns 401 without token", async () => {
    const res = await api
      .post("/cart/items")
      .send({ productId: testProductId });

    expect(res.status).toBe(401);
  });

  it("adds a new item to the cart", async () => {
    const token = await getToken();

    const res = await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].productId).toBe(testProductId);
    expect(res.body.products[0].quantity).toBe(1);
  });

  it("increments quantity when adding the same product again", async () => {
    const token = await getToken("cartadd@test.com", "cartadd");
    await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    const res = await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    expect(res.status).toBe(200);
    expect(res.body.products[0].quantity).toBe(2);
  });

  it("returns 422 when productId is missing", async () => {
    const token = await getToken();

    const res = await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ---- Remove Item (protected) ---- //

describe("DELETE /cart/items", () => {
  it("returns 401 without token", async () => {
    const res = await api
      .delete("/cart/items")
      .send({ productId: testProductId });

    expect(res.status).toBe(401);
  });

  it("decrements quantity by 1", async () => {
    const token = await getToken("cartdecrement@test.com", "cartdecrement");
    await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId, quantity: 3 });

    const res = await api
      .delete("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId, quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.products[0].quantity).toBe(2);
  });

  it("removes the item when quantity reaches 0", async () => {
    const token = await getToken("cartremove@test.com", "cartremove");
    await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    const res = await api
      .delete("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });

  it("returns 404 when product is not in cart", async () => {
    const token = await getToken("cartnotfound@test.com", "cartnotfound");

    const res = await api
      .delete("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    expect(res.status).toBe(404);
  });

  it("returns 422 when productId is missing", async () => {
    const token = await getToken();

    const res = await api
      .delete("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ---- Clear Cart (protected) ---- //

describe("DELETE /cart", () => {
  it("returns 401 without token", async () => {
    const res = await api.delete("/cart");

    expect(res.status).toBe(401);
  });

  it("clears the cart when it has items", async () => {
    const token = await getToken("cartclear@test.com", "cartclear");
    await api
      .post("/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: testProductId });

    const res = await api
      .delete("/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("returns 404 when cart doesn't exist", async () => {
    const token = await getToken("cartnocart@test.com", "cartnocart");

    const res = await api
      .delete("/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
