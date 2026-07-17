import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';
import { ObjectId } from "mongodb";
import { Product } from "#src/types.js";
import { jest } from "@jest/globals";

jest.setTimeout(30000);

const api = request(app);

const productsDb = mongo.collection<Product>("products");

beforeEach(async () => {
  await postgres.refreshToken.deleteMany({});
  await postgres.user.deleteMany({});
  await productsDb.drop().catch(() => {});
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
  await postgres.user.create({
    data: {
      username: "productowner",
      email: "owner@test.com",
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

async function getAdminToken() {
  const email = "admin@test.com";
  await registerUser(email, "admin", "password123");
  await postgres.user.update({ where: { email }, data: { role: "ADMIN" } });
  const res = await login(email, "password123");
  return res.body.accessToken as string;
}

async function seedProduct(owner: number = 2, name: string = "Test Product") {
  const res = await productsDb.insertOne({
    name,
    price: 29.99,
    description: "Integration test product",
    owner,
    details: { color: "red" },
    imageFilename: "",
    uploadedAt: Date.now(),
  });
  return res.insertedId;
}

async function createProductViaApi(token: string) {
  // Upload a test image first to get a valid filename
  const uploadRes = await api
    .post("/image")
    .set("Authorization", `Bearer ${token}`)
    .attach("image", Buffer.from("fake-image"), "test.png");
  const filename = uploadRes.body.filename || "test.png";

  return await api
    .post("/product")
    .set("Authorization", `Bearer ${token}`)
    .send({
      productName: "API Created Product",
      price: 49.99,
      imageFilename: filename,
      details: { size: "L" },
      description: "Created through the API",
    });
}

// ---- Create (protected) ---- //

describe("POST /product", () => {
  it("returns 401 without token", async () => {
    const res = await api.post("/product").send({
      productName: "Test",
      price: 10,
      imageFilename: "",
    });

    expect(res.status).toBe(401);
  });

  it("creates a product with valid data", async () => {
    const token = await getToken();

    const res = await createProductViaApi(token);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 422 when required fields are missing", async () => {
    const token = await getToken();

    const res = await api
      .post("/product")
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 10 });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ---- Get ---- //

describe("GET /product/:id", () => {
  it("returns a product by ID", async () => {
    const productId = await seedProduct();

    const res = await api.get(`/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Product");
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("_id");
  });

  it("returns 404 for non-existent product", async () => {
    const res = await api.get(`/product/${new ObjectId()}`);

    expect(res.status).toBe(404);
  });
});

// ---- List ---- //

describe("GET /product", () => {
  it("returns empty array when no products exist", async () => {
    const res = await api.get("/product");

    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
  });

  it("returns paginated products sorted newest first", async () => {
    await seedProduct(2, "Second");
    await new Promise((r) => setTimeout(r, 10));
    await seedProduct(2, "First");

    const res = await api.get("/product");

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.products[0].name).toBe("First");
    expect(res.body.products[1].name).toBe("Second");
  });

  it("filters by search query", async () => {
    await seedProduct(2, "Red Chair");
    await seedProduct(2, "Blue Table");

    const res = await api.get("/product?search=chair");

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Red Chair");
  });

  it("returns empty array when search matches nothing", async () => {
    await seedProduct(2, "Some Product");

    const res = await api.get("/product?search=nonexistent");

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });
});

// ---- List by User ---- //

describe("GET /product/user/:id", () => {
  it("returns products owned by the given user", async () => {
    await seedProduct(2, "User 2 Product");
    await seedProduct(3, "User 3 Product");

    const res = await api.get("/product/user/2");

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("User 2 Product");
  });

  it("returns 422 for invalid user ID", async () => {
    const res = await api.get("/product/user/abc");

    expect(res.status).toBe(422);
  });
});

// ---- Update (protected) ---- //

describe("PATCH /product/:id", () => {
  it("returns 401 without token", async () => {
    const res = await api.patch(`/product/${new ObjectId()}`).send({
      productName: "Updated",
    });

    expect(res.status).toBe(401);
  });

  it("returns 204 when owner updates their product", async () => {
    const token = await getToken("productupdater@test.com", "productupdater");
    const productRes = await createProductViaApi(token);
    const productId = productRes.body.id;

    const res = await api
      .patch(`/product/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productName: "Updated Name" });

    expect(res.status).toBe(204);
  });

  it("returns 204 when ADMIN updates someone else's product", async () => {
    const productId = await seedProduct(2);
    const token = await getAdminToken();

    const res = await api
      .patch(`/product/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productName: "Admin Updated" });

    expect(res.status).toBe(204);
  });

  it("returns 403 when a different USER tries to update", async () => {
    const productId = await seedProduct(2);
    const token = await getToken("other@test.com", "otheruser");

    const res = await api
      .patch(`/product/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productName: "Hacked" });

    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent product", async () => {
    const token = await getToken();

    const res = await api
      .patch(`/product/${new ObjectId()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productName: "Nope" });

    expect(res.status).toBe(404);
  });
});

// ---- Delete (protected) ---- //

describe("DELETE /product/:id", () => {
  it("returns 401 without token", async () => {
    const res = await api.delete(`/product/${new ObjectId()}`);

    expect(res.status).toBe(401);
  });

  it("returns 204 when owner deletes their product", async () => {
    const token = await getToken("productdeleter@test.com", "productdeleter");
    const productRes = await createProductViaApi(token);
    const productId = productRes.body.id;

    const res = await api
      .delete(`/product/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("returns 204 when ADMIN deletes someone else's product", async () => {
    const productId = await seedProduct(2);
    const token = await getAdminToken();

    const res = await api
      .delete(`/product/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("returns 403 when a different USER tries to delete", async () => {
    const productId = await seedProduct(2);
    const token = await getToken("deleter@test.com", "deleter");

    const res = await api
      .delete(`/product/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent product", async () => {
    const token = await getToken();

    const res = await api
      .delete(`/product/${new ObjectId()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
