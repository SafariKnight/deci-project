import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';
import { jest } from "@jest/globals";

jest.setTimeout(30000);

const api = request(app);
const filesDb = mongo.collection("files");

beforeEach(async () => {
  await postgres.refreshToken.deleteMany({});
  await postgres.user.deleteMany({});
  await filesDb.drop().catch(() => {});
  await mongo
    .collection("products")
    .drop()
    .catch(() => {});
  await mongo
    .collection("reviews")
    .drop()
    .catch(() => {});
  await mongo
    .collection("carts")
    .drop()
    .catch(() => {});
  await mongo
    .collection("carts")
    .drop()
    .catch(() => {});
});

afterEach(async () => {
  const allFiles = await filesDb.find({}).toArray();
  for (const f of allFiles) {
    try {
      await mongo
        .collection("images.files")
        .deleteOne({ _id: f.gridfsId as any });
      await mongo
        .collection("images.chunks")
        .deleteMany({ files_id: f.gridfsId as any });
    } catch {
      // GridFS file might not exist, that's fine
    }
  }
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

const testImageBuffer = Buffer.from("fake-image-content");

// ---- Upload (protected) ---- //

describe("POST /image", () => {
  it("returns 401 without token", async () => {
    const res = await api
      .post("/image")
      .attach("image", testImageBuffer, "test.png");

    expect(res.status).toBe(401);
  });

  it("returns 422 when no file is attached", async () => {
    const token = await getToken();

    const res = await api
      .post("/image")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(422);
  });

    it("uploads a file and returns metadata", async () => {
    const token = await getToken("imgupload@test.com", "imgupload");    const res = await api
      .post("/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", testImageBuffer, "test.png");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("filename");
    expect(res.body).toHaveProperty("path");
    expect(typeof res.body.filename).toBe("string");
    expect(res.body.filename).toMatch(/\.png$/);
  });
});

// ---- Delete (protected) ---- //

describe("DELETE /image/by-name/:filename", () => {
  it("returns 401 without token", async () => {
    const res = await api.delete("/image/by-name/test.png");

    expect(res.status).toBe(401);
  });

  it("deletes a file the user owns", async () => {
    const token = await getToken("imgdelete@test.com", "imgdelete");
    const uploadRes = await api
      .post("/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", testImageBuffer, "delete-me.png");

    const filename = uploadRes.body.filename;

    const res = await api
      .delete(`/image/by-name/${filename}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("returns 403 when a different user tries to delete", async () => {
    const ownerToken = await getToken("imgowner@test.com", "imgowner");
    const uploadRes = await api
      .post("/image")
      .set("Authorization", `Bearer ${ownerToken}`)
      .attach("image", testImageBuffer, "protected.png");
    const filename = uploadRes.body.filename;

    const otherToken = await getToken("imgother@test.com", "imgother");
    const res = await api
      .delete(`/image/by-name/${filename}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent filename", async () => {
    const token = await getToken();

    const res = await api
      .delete("/image/by-name/nonexistent.png")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
