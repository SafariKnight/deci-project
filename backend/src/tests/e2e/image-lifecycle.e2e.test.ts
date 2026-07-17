import "#src/config/env.ts";
import app from "#src/app.js";
import request from "supertest";
import { postgres } from "#src/config/postgres.js";
import { mongo } from "#src/config/mongo.js";
import { jest } from "@jest/globals";

jest.setTimeout(30000);

const api = request(app);

let user1Token: string;
let user2Token: string;
let uploadedFilename: string;

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
  await mongo
    .collection("images.files")
    .drop()
    .catch(() => {});
  await mongo
    .collection("images.chunks")
    .drop()
    .catch(() => {});
});

describe("Image lifecycle: upload → cross-user delete → owner delete → verify gone", () => {
  it("Step 1: registers user1 and uploads an image", async () => {
    await api.post("/auth/register").send({
      username: "imguser1",
      email: "img1@test.com",
      password: "password123",
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email: "img1@test.com", password: "password123" });
    user1Token = loginRes.body.accessToken;

    const res = await api
      .post("/image")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("image", Buffer.from("e2e-image-content"), "e2e-test.png");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("filename");
    uploadedFilename = res.body.filename;
  });

  it("Step 2: registers user2 (different user)", async () => {
    await api.post("/auth/register").send({
      username: "imguser2",
      email: "img2@test.com",
      password: "password123",
    });
    const loginRes = await api
      .post("/auth/login")
      .send({ email: "img2@test.com", password: "password123" });
    user2Token = loginRes.body.accessToken;
  });

  it("Step 3: user2 cannot delete user1's image", async () => {
    const res = await api
      .delete(`/image/by-name/${uploadedFilename}`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
  });

  it("Step 4: user1 can delete their own image", async () => {
    const res = await api
      .delete(`/image/by-name/${uploadedFilename}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
  });

  it("Step 5: deleting the same image again returns 404", async () => {
    const res = await api
      .delete(`/image/by-name/${uploadedFilename}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(404);
  });
});
