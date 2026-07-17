import "#src/config/env.ts";
import {
  createAccessToken,
  invalidateRefreshToken,
  makeRefreshToken,
  verifyJWT,
} from "./tokenService.js";

const testData = { test: "data" };

describe("JWT Controller Signing & Verifying", () => {
  it("Signs and verifys correctly", async () => {
    const jwt = await createAccessToken(testData);
    const data = await verifyJWT(jwt);

    expect(data.test).toEqual(testData.test);
  });

  it("Payload contains ONLY iat & exp by default", async () => {
    const jwt = await createAccessToken({});
    const data = await verifyJWT(jwt);

    expect(data.exp).toBeDefined();
    expect(data.iat).toBeDefined();
    expect(data.iss).toBeUndefined();
    expect(data.aud).toBeUndefined();
    expect(data.iss).toBeUndefined();
    expect(data.jti).toBeUndefined();
  });

  it("rejects a token signed with a different secret", async () => {
    const jwt = await createAccessToken(testData);

    // Tamper with the token to simulate wrong signature
    const parts = jwt.split(".");
    const tampered = `${parts[0]}.${parts[1]}.invalidsignature`;

    await expect(verifyJWT(tampered)).rejects.toThrow();
  });
});

describe("makeRefreshToken", () => {
  it("generates a 64-character hex string", async () => {
    const token = await makeRefreshToken();

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates unique tokens each call", async () => {
    const token1 = await makeRefreshToken();
    const token2 = await makeRefreshToken();

    expect(token1).not.toBe(token2);
  });
});

describe("invalidateRefreshToken", () => {
  it("marks a valid refresh token as invalid", async () => {
    const { postgres } = await import("#src/config/postgres.ts");

    // Create a user first to satisfy the foreign key constraint
    const user = await postgres.user.create({
      data: {
        username: "tokentest",
        email: "tokentest@example.com",
        password: "dummyhash",
      },
    });

    const token = await makeRefreshToken();
    await postgres.refreshToken.create({
      data: { token, userId: user.id },
    });

    const result = await invalidateRefreshToken(token);

    expect(result.ok).toBe(true);

    const stored = await postgres.refreshToken.findUnique({
      where: { token },
    });
    expect(stored!.valid).toBe(false);
  });

  it("returns TOKEN_NOT_FOUND for non-existent token", async () => {
    const result = await invalidateRefreshToken(
      "0000000000000000000000000000000000000000000000000000000000000000",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeDefined();
    }
  });

  afterEach(async () => {
    const { postgres } = await import("#src/config/postgres.ts");
    await postgres.refreshToken.deleteMany({});
    await postgres.user.deleteMany({});
  });
});
