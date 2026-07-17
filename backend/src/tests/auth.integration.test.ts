import "#src/config/env.ts";
import app from '#src/app.js';
import request from "supertest";
import { postgres } from '#src/config/postgres.js';
import { mongo } from '#src/config/mongo.js';
import { hashPassword } from '#src/services/passwordService.js';

const api = request(app);

beforeEach(async () => {
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

async function getOwnerToken() {
  const email = "owner@test.com";
  await registerUser(email, "owner", "password123");
  await postgres.user.update({ where: { email }, data: { role: "OWNER" } });
  const res = await login(email, "password123");
  return res.body.accessToken as string;
}

async function createUserInDb(
  email: string,
  username: string,
  role: "USER" | "ADMIN" | "OWNER" = "USER",
) {
  return await postgres.user.create({
    data: {
      username,
      email,
      password: await hashPassword("password123"),
      role,
    },
  });
}

// ---- Registration ---- //

describe("POST /auth/register", () => {
  it("registers a user with valid data", async () => {
    const res = await registerUser("new@test.com", "newuser", "password123");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.username).toBe("newuser");
    expect(res.body.email).toBe("new@test.com");
    expect(res.body).not.toHaveProperty("password");
  });

  it("returns 422 when username is missing", async () => {
    const res = await api.post("/auth/register").send({
      email: "test@test.com",
      password: "password123",
    });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 422 for invalid email", async () => {
    const res = await api.post("/auth/register").send({
      username: "user",
      email: "notanemail",
      password: "password123",
    });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 409 for duplicate email", async () => {
    await registerUser("dupe@test.com", "user1", "password123");
    const res = await registerUser("dupe@test.com", "user2", "password456");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email/i);
  });
});

// ---- Login ---- //

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await createUserInDb("login@test.com", "loginuser");
  });

  it("logs in with valid credentials", async () => {
    const res = await login("login@test.com", "password123");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("login@test.com");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 401 for unknown email", async () => {
    const res = await login("unknown@test.com", "password123");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("email_missing");
  });

  it("returns 401 for wrong password", async () => {
    const res = await login("login@test.com", "wrongpassword");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("wrong_password");
  });

  it("returns 422 when email field is missing", async () => {
    const res = await api.post("/auth/login").send({ password: "password123" });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ---- Me (protected) ---- //

describe("GET /auth/me", () => {
  it("returns 401 without token", async () => {
    const res = await api.get("/auth/me");

    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await api
      .get("/auth/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid token", async () => {
    const token = await getToken("me@test.com", "meuser");

    const res = await api
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me@test.com");
    expect(res.body.username).toBe("meuser");
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("role");
  });
});

// ---- Logout (protected) ---- //

describe("GET /auth/logout", () => {
  it("returns 401 without token", async () => {
    const res = await api.get("/auth/logout");

    expect(res.status).toBe(401);
  });

  it("returns 204 with valid token and existing refresh token", async () => {
    const email = "logout@test.com";
    await createUserInDb(email, "logoutuser");
    const loginRes = await login(email, "password123");
    const token = loginRes.body.accessToken as string;
    const cookie = loginRes.headers["set-cookie"] as unknown as string[];

    const res = await api
      .get("/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(204);
  });

  it("returns 401 when calling logout twice", async () => {
    const email = "logout2@test.com";
    await createUserInDb(email, "logoutuser2");
    const loginRes = await login(email, "password123");
    const token = loginRes.body.accessToken as string;
    const cookie = loginRes.headers["set-cookie"] as unknown as string[];

    await api
      .get("/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", cookie);

    const res = await api
      .get("/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(401);
  });
});

// ---- Refresh ---- //

describe("GET /auth/refresh", () => {
  it("returns 401 without cookie", async () => {
    const res = await api.get("/auth/refresh");

    expect(res.status).toBe(401);
  });

  it("returns 200 with a valid refresh cookie", async () => {
    const email = "refresh@test.com";
    await createUserInDb(email, "refreshuser");
    const loginRes = await login(email, "password123");
    const cookie = loginRes.headers["set-cookie"] as unknown as string[];

    const res = await api.get("/auth/refresh").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");
  });

  it("returns 401 with an invalidated refresh token (manually invalidated)", async () => {
    const email = "refreshexpired@test.com";
    await createUserInDb(email, "refreshexpired");
    const loginRes = await login(email, "password123");
    const cookie = loginRes.headers["set-cookie"] as unknown as string[];

    // Manually invalidate the refresh token in the database
    // Extract the cookie value (format: "auth_refresh_token=<token>; ...")
    const cookieValue = (cookie[0] as string).split(";")[0].split("=")[1];
    await postgres.refreshToken.update({
      where: { token: cookieValue },
      data: { valid: false },
    });

    const res = await api.get("/auth/refresh").set("Cookie", cookie);

    expect(res.status).toBe(401);
  });
});

// ---- User Details ---- //

describe("GET /auth/users/:id", () => {
  it("returns the user for a valid ID", async () => {
    const user = await createUserInDb("details@test.com", "detailsuser");

    const res = await api.get(`/auth/users/${user.id}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("details@test.com");
    expect(res.body.username).toBe("detailsuser");
    expect(res.body).toHaveProperty("role");
  });

  it("returns 404 for non-existent user ID", async () => {
    const res = await api.get("/auth/users/999999");

    expect(res.status).toBe(404);
  });

  it("returns 404 for invalid (NaN) ID", async () => {
    const res = await api.get("/auth/users/abc");

    expect(res.status).toBe(404);
  });
});

// ---- Change Role (admin/owner protected) ---- //

describe("POST /auth/change-role", () => {
  it("returns 401 without token", async () => {
    const res = await api.post("/auth/change-role").send({
      id: 1,
      newRole: "ADMIN",
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 for a regular USER", async () => {
    const target = await createUserInDb("target@test.com", "target");
    const token = await getToken();

    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: target.id, newRole: "ADMIN" });

    expect(res.status).toBe(403);
  });

  it("returns 204 when ADMIN changes another user to ADMIN", async () => {
    const target = await createUserInDb("target2@test.com", "target2");
    const token = await getAdminToken();

    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: target.id, newRole: "ADMIN" });

    expect(res.status).toBe(204);
  });

  it("returns 403 when ADMIN tries to promote to OWNER", async () => {
    const target = await createUserInDb("target3@test.com", "target3");
    const token = await getAdminToken();

    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: target.id, newRole: "OWNER" });

    expect(res.status).toBe(403);
  });

  it("returns 403 when trying to change an OWNER's role", async () => {
    const owner = await createUserInDb(
      "ownerchange@test.com",
      "ownerchange",
      "OWNER",
    );
    const token = await getOwnerToken();

    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: owner.id, newRole: "ADMIN" });

    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent target user", async () => {
    const token = await getAdminToken();

    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: 999999, newRole: "ADMIN" });

    expect(res.status).toBe(404);
  });

  it("returns 422 for invalid body", async () => {
    const token = await getAdminToken();

    const res = await api
      .post("/auth/change-role")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: "notanumber", newRole: "INVALID_ROLE" });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});
