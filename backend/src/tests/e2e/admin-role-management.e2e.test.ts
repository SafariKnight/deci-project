import "#src/config/env.ts";
import app from "#src/app.js";
import request from "supertest";
import { postgres } from "#src/config/postgres.js";
import { mongo } from "#src/config/mongo.js";
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

describe("Admin role management: create users → change roles → verify permissions", () => {
  let regularUserId: number;
  let ownerUserId: number;
  let adminToken: string;
  let regularToken: string;
  let ownerToken: string;

  it("Step 1: creates a regular user and an admin user", async () => {
    // Regular user
    await api.post("/auth/register").send({
      username: "regular",
      email: "regular@test.com",
      password: "password123",
    });
    const regularLogin = await api
      .post("/auth/login")
      .send({ email: "regular@test.com", password: "password123" });
    regularToken = regularLogin.body.accessToken;
    regularUserId = regularLogin.body.user.id;

    // Admin user — register, then upgrade in DB
    await api.post("/auth/register").send({
      username: "adminuser",
      email: "admin@test.com",
      password: "password123",
    });
    await postgres.user.update({
      where: { email: "admin@test.com" },
      data: { role: "ADMIN" },
    });
    const adminLogin = await api
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "password123" });
    adminToken = adminLogin.body.accessToken;

    // Owner user
    await api.post("/auth/register").send({
      username: "owneruser",
      email: "owner@test.com",
      password: "password123",
    });
    await postgres.user.update({
      where: { email: "owner@test.com" },
      data: { role: "OWNER" },
    });
    const ownerLogin = await api
      .post("/auth/login")
      .send({ email: "owner@test.com", password: "password123" });
    ownerToken = ownerLogin.body.accessToken;
    ownerUserId = ownerLogin.body.user.id;
  });

  it("Step 2: ADMIN changes regular user to ADMIN", async () => {
    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ id: regularUserId, newRole: "ADMIN" });

    expect(res.status).toBe(204);
  });

  it("Step 3: verifies the role change persisted", async () => {
    const res = await api.get(`/auth/users/${regularUserId}`);

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("ADMIN");
  });

  it("Step 4: ADMIN cannot promote to OWNER", async () => {
    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ id: regularUserId, newRole: "OWNER" });

    expect(res.status).toBe(403);
  });

  it("Step 5: ADMIN cannot change an OWNER's role", async () => {
    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ id: ownerUserId, newRole: "ADMIN" });

    expect(res.status).toBe(403);
  });

  it("Step 6: OWNER can change another user's role", async () => {
    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ id: regularUserId, newRole: "USER" });

    expect(res.status).toBe(204);
  });

  it("Step 7: regular USER cannot change roles", async () => {
    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ id: ownerUserId, newRole: "USER" });

    expect(res.status).toBe(403);
  });
});
