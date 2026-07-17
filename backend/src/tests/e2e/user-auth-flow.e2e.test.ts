import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';

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

describe("Full auth flow: register → login → me → refresh → logout → refresh fails", () => {
  let accessToken: string;
  let refreshCookie: string[];
  let newAccessToken: string;
  const email = "flow@test.com";
  const username = "flowuser";
  const password = "password123";

  it("Step 1: registers a new user", async () => {
    const res = await api.post("/auth/register").send({
      username,
      email,
      password,
    });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe(username);
    expect(res.body.email).toBe(email);
    expect(res.body).not.toHaveProperty("password");
    expect(res.body).toHaveProperty("id");
  });

  it("Step 2: logs in with those credentials", async () => {
    const res = await api.post("/auth/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.user.email).toBe(email);
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.headers["set-cookie"]).toBeDefined();

    accessToken = res.body.accessToken;
    refreshCookie = res.headers["set-cookie"] as unknown as string[];
  });

  it("Step 3: GET /auth/me returns the user", async () => {
    const res = await api
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.body.username).toBe(username);
  });

  it("Step 4: refreshes the access token", async () => {
    const res = await api.get("/auth/refresh").set("Cookie", refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    newAccessToken = res.body.accessToken;
  });

  it("Step 5: new token also works on /auth/me", async () => {
    const res = await api
      .get("/auth/me")
      .set("Authorization", `Bearer ${newAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it("Step 6: logs out and invalidates the refresh token", async () => {
    const res = await api
      .get("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", refreshCookie);

    expect(res.status).toBe(204);
  });

  it("Step 7: using the same refresh cookie now returns 401", async () => {
    const res = await api.get("/auth/refresh").set("Cookie", refreshCookie);

    expect(res.status).toBe(401);
  });
});
